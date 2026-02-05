import express from 'express';
import { query } from '../lib/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { Logger } from '../lib/logger.js';

const router = express.Router();

// GET /pvz - List all PVZ points
router.get('/pvz', async (req, res) => {
    try {
        const result = await query('SELECT id, name, address, brand FROM pvz_points ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        Logger.error('Error fetching PVZ:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /employees - List employees with filters
router.get('/employees', authenticateToken, async (req, res) => {
    try {
        const { pvzId, status, search } = req.query;

        let sql = `
            SELECT e.*, p.name as main_pvz_name 
            FROM employees e 
            LEFT JOIN pvz_points p ON e.main_pvz_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (pvzId) {
            sql += ` AND e.main_pvz_id = $${paramIdx++}`;
            params.push(pvzId);
        }
        if (status) {
            sql += ` AND e.status = $${paramIdx++}`;
            params.push(status);
        }
        if (search) {
            sql += ` AND (e.full_name ILIKE $${paramIdx++} OR e.phone ILIKE $${paramIdx++} OR e.iin ILIKE $${paramIdx++})`;
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }

        sql += ' ORDER BY e.created_at DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        Logger.error('Error fetching employees:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /employees - Create new employee
router.post('/employees', async (req, res) => {
    try {
        const { iin, full_name, phone, email, role, main_pvz_id, status, address, base_rate, probation_until, hired_at, iban } = req.body;

        // Basic validation
        if (!iin || !full_name || !role) {
            return res.status(400).json({ error: 'Missing required fields (IIN, Full Name, Role)' });
        }

        const result = await query(`
            INSERT INTO employees (
                iin, full_name, phone, email, role, main_pvz_id, status,
                address, base_rate, probation_until, hired_at, iban
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [
            iin,
            full_name,
            phone,
            email,
            role,
            main_pvz_id || null,
            status || 'new',
            address || null,
            base_rate || null,
            probation_until || null,
            hired_at || null,
            iban || null
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        Logger.error('Error creating employee:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// GET /employees/:id - Get single employee details
router.get('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT e.*, p.name as main_pvz_name, p.address as main_pvz_address
            FROM employees e 
            LEFT JOIN pvz_points p ON e.main_pvz_id = p.id
            WHERE e.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('Error fetching employee:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /employees/:id/status - Update employee status
router.patch('/employees/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        // Prepare update query
        let sql = 'UPDATE employees SET status = $1, updated_at = NOW()';
        const params = [status, id];
        let paramIdx = 3;

        // Set timestamps based on status
        if (status === 'active') {
            sql += `, hired_at = COALESCE(hired_at, NOW())`;
        } else if (status === 'fired') {
            sql += `, fired_at = COALESCE(fired_at, NOW())`;
        }

        // Handle checklist updates if provided
        if (req.body.onboarding_checklist) {
            sql += `, onboarding_checklist = $${paramIdx++}`;
            params.push(req.body.onboarding_checklist);
        }

        sql += ` WHERE id = $2 RETURNING *`;

        const result = await query(sql, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('Error updating employee status:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /employees/:id/transfer - Transfer employee to another PVZ
router.post('/employees/:id/transfer', async (req, res) => {
    try {
        const { id } = req.params;
        const { pvzId, date, comment } = req.body;

        if (!pvzId || !date) {
            return res.status(400).json({ error: 'PVZ ID and Date are required' });
        }

        // Update employee's main PVZ
        const result = await query(`
            UPDATE employees 
            SET main_pvz_id = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [pvzId, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        Logger.info(`Employee ${id} transferred to PVZ ${pvzId} on ${date}. Comment: ${comment}`);

        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('Error transferring employee:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /discipline - Create a disciplinary record
router.post('/discipline', async (req, res) => {
    try {
        const { employeeId, type, reason, comment, date } = req.body;

        if (!employeeId || !type || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Mock implementation
        Logger.info(`Discipline record created: ${type} for ${employeeId} on ${date}. Reason: ${reason}`);

        res.json({ id: 'mock-discipline-id-' + Date.now(), ...req.body });
    } catch (err) {
        Logger.error('Error creating discipline record:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /discipline - Get disciplinary records
router.get('/discipline', async (req, res) => {
    try {
        const { employeeId } = req.query;

        // Mock data
        const records = [
            { id: '1', employeeId: '1', type: 'warning', reason: 'Late arrival', date: '2023-10-01', comment: 'First warning' },
            { id: '2', employeeId: '1', type: 'explanation', reason: 'Missed shift', date: '2023-10-15', comment: 'Provided medical certificate' }
        ];

        if (employeeId) {
            res.json(records.filter(r => r.employeeId === employeeId));
        } else {
            res.json(records);
        }
    } catch (err) {
        Logger.error('Error fetching discipline records:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /motivation/bonuses - Calculate tenure bonuses
router.get('/motivation/bonuses', async (req, res) => {
    try {
        const result = await query(`
            SELECT id, full_name, hired_at, main_pvz_id 
            FROM employees 
            WHERE status = 'active' AND hired_at IS NOT NULL
        `);

        const bonuses = result.rows.map(emp => {
            const hireDate = new Date(emp.hired_at);
            const now = new Date();
            const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

            let bonus = 0;
            let nextBonus = 0;
            let monthsToNext = 0;

            if (months >= 36) { bonus = 100000; }
            else if (months >= 24) { bonus = 50000; nextBonus = 100000; monthsToNext = 36 - months; }
            else if (months >= 12) { bonus = 20000; nextBonus = 50000; monthsToNext = 24 - months; }
            else if (months >= 6) { bonus = 15000; nextBonus = 20000; monthsToNext = 12 - months; }
            else { nextBonus = 15000; monthsToNext = 6 - months; }

            return {
                employeeId: emp.id,
                fullName: emp.full_name,
                tenureMonths: months,
                currentBonus: bonus,
                nextBonus: { amount: nextBonus, monthsLeft: monthsToNext }
            };
        });

        res.json(bonuses);
    } catch (err) {
        Logger.error('Error calculating bonuses:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
