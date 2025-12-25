import express from 'express';
import { query } from '../lib/db.js';

const router = express.Router();

// GET /shifts - List shifts
router.get('/shifts', async (req, res) => {
    try {
        const { pvzId, start, end } = req.query;

        let sql = `
            SELECT s.*, e.full_name, e.role 
            FROM shifts s
            JOIN employees e ON s.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (pvzId) {
            sql += ` AND s.pvz_id = $${paramIdx++}`;
            params.push(pvzId);
        }
        if (start) {
            sql += ` AND s.date >= $${paramIdx++}`;
            params.push(start);
        }
        if (end) {
            sql += ` AND s.date <= $${paramIdx++}`;
            params.push(end);
        }

        sql += ' ORDER BY s.date ASC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching shifts:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /shifts - Create a single shift manually
router.post('/shifts', async (req, res) => {
    try {
        const { employeeId, pvzId, date, type, status, plannedHours } = req.body;

        if (!employeeId || !pvzId || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await query(`
            INSERT INTO shifts (employee_id, pvz_id, date, type, status, planned_hours)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [employeeId, pvzId, date, type || 'work', status || 'pending', plannedHours || 12]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating shift:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// PATCH /shifts/:id - Update a shift
router.patch('/shifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId, date, type, status, plannedHours, factHours } = req.body;

        let sql = 'UPDATE shifts SET updated_at = NOW()';
        const params = [id];
        let paramIdx = 2;

        if (employeeId) { sql += `, employee_id = $${paramIdx++}`; params.push(employeeId); }
        if (date) { sql += `, date = $${paramIdx++}`; params.push(date); }
        if (type) { sql += `, type = $${paramIdx++}`; params.push(type); }
        if (status) { sql += `, status = $${paramIdx++}`; params.push(status); }
        if (plannedHours !== undefined) { sql += `, planned_hours = $${paramIdx++}`; params.push(plannedHours); }
        if (factHours !== undefined) { sql += `, actual_hours = $${paramIdx++}`; params.push(factHours); }

        sql += ` WHERE id = $1 RETURNING *`;

        const result = await query(sql, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating shift:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /shifts/:id - Delete a shift
router.delete('/shifts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM shifts WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.json({ message: 'Shift deleted', id });
    } catch (err) {
        console.error('Error deleting shift:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /shifts/generate - Generate A/B Schedule
router.post('/shifts/generate', async (req, res) => {
    try {
        const { pvzId, teamA, teamB, startDate, endDate } = req.body;

        if (!pvzId || !teamA || !teamB || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const shifts = [];
        let current = new Date(start);

        // 0 = Team A (Day 1), 1 = Team A (Day 2), 2 = Team B (Day 3), 3 = Team B (Day 4)
        let cycleDay = 0;

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const isTeamA = cycleDay < 2; // 0, 1 -> Team A
            const team = isTeamA ? teamA : teamB;

            for (const empId of team) {
                shifts.push({
                    employee_id: empId,
                    pvz_id: pvzId,
                    date: dateStr,
                    type: 'scheduled',
                    status: 'pending'
                });
            }

            // Advance date
            current.setDate(current.getDate() + 1);
            cycleDay = (cycleDay + 1) % 4; // 0, 1, 2, 3 loop
        }

        // Bulk Insert
        let insertedCount = 0;

        await query('BEGIN');

        for (const shift of shifts) {
            const result = await query(`
                INSERT INTO shifts (employee_id, pvz_id, date, type, status)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (employee_id, date) DO NOTHING
                RETURNING id
            `, [shift.employee_id, shift.pvz_id, shift.date, shift.type, shift.status]);

            if (result.rows.length > 0) insertedCount++;
        }

        await query('COMMIT');

        res.json({ message: 'Schedule generated', generated: insertedCount, total_days: shifts.length });

    } catch (err) {
        await query('ROLLBACK');
        console.error('Error generating schedule:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /timesheets - Get aggregated timesheet data
router.get('/timesheets', async (req, res) => {
    try {
        const { month, pvzId } = req.query; // month in YYYY-MM format

        if (!month) {
            return res.status(400).json({ error: 'Month is required' });
        }

        let sql = `
            SELECT 
                s.id, s.employee_id, s.pvz_id, s.date, s.type, s.status, s.planned_hours, s.actual_hours as fact_hours,
                e.full_name as employee_name,
                p.name as pvz_name
            FROM shifts s
            JOIN employees e ON s.employee_id = e.id
            JOIN pvz_points p ON s.pvz_id = p.id
            WHERE to_char(s.date, 'YYYY-MM') = $1
        `;
        const params = [month];

        if (pvzId) {
            sql += ` AND s.pvz_id = $2`;
            params.push(pvzId);
        }

        sql += ` ORDER BY s.date ASC`;

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching timesheets:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /timesheets/approve - Approve timesheet for a month
router.post('/timesheets/approve', async (req, res) => {
    try {
        const { month, pvzId } = req.body;

        if (!month) {
            return res.status(400).json({ error: 'Month is required' });
        }

        let sql = `
            UPDATE shifts 
            SET status = 'approved', updated_at = NOW()
            WHERE to_char(date, 'YYYY-MM') = $1 AND status != 'approved'
        `;
        const params = [month];

        if (pvzId) {
            sql += ` AND pvz_id = $2`;
            params.push(pvzId);
        }

        const result = await query(sql, params);
        res.json({ message: 'Timesheet approved', updatedCount: result.rowCount });
    } catch (err) {
        console.error('Error approving timesheet:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
