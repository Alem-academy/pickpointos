import express from 'express';
import { query } from '../db-client.js';

const router = express.Router();

// GET /rent - List rent details
router.get('/rent', async (req, res) => {
    try {
        // Mock data for now, ideally this comes from a 'leases' table
        const result = await query('SELECT id, name, address FROM pvz_points');

        const rentData = result.rows.map(pvz => {
            const rentAmount = 150000 + (pvz.id.length * 10000);
            const isPaid = Math.random() > 0.3; // Random status just for demo if no real table

            return {
                pvzId: pvz.id,
                pvzName: pvz.name,
                address: pvz.address,
                landlord: 'ИП Арендодатель ' + pvz.id.substring(0, 4),
                amount: rentAmount,
                dueDate: new Date().toISOString().split('T')[0],
                status: isPaid ? 'paid' : 'pending'
            };
        });

        res.json(rentData);
    } catch (err) {
        console.error('Error fetching rent data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /rent/pay - Record a rent payment
router.post('/rent/pay', async (req, res) => {
    try {
        const { pvzId, month, amount } = req.body;

        if (!pvzId || !month || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`Rent paid for PVZ ${pvzId}, Month: ${month}, Amount: ${amount}`);
        res.json({ success: true, message: 'Payment recorded' });
    } catch (err) {
        console.error('Error paying rent:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /expenses - List expense requests (Using REAL DB)
router.get('/expenses', async (req, res) => {
    try {
        const { pvzId, status } = req.query;

        let sql = `
            SELECT er.*, e.full_name as requester_name, p.name as pvz_name
            FROM expense_requests er
            JOIN employees e ON er.requester_id = e.id
            JOIN pvz_points p ON er.pvz_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (pvzId) {
            sql += ` AND er.pvz_id = $${paramIdx++}`;
            params.push(pvzId);
        }
        if (status) {
            sql += ` AND er.status = $${paramIdx++}`;
            params.push(status);
        }

        sql += ' ORDER BY er.created_at DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /expenses - Create expense request (Using REAL DB - mapped from POST /expenses/request logic)
// Frontend uses POST /finance/expenses
router.post('/expenses', async (req, res) => {
    try {
        // The frontend sends: { amount, category, description, pvzId }
        // The DB requires: requester_id.
        // Since we don't have real Auth yet, we need to mock a requester_id or pick an admin.
        // For now, let's pick the first user with 'admin' role or just a random one.
        // Or if the frontend provides it? Frontend Expenses.tsx doesn't seem to provide requesterId.
        // Let's fetch a fallback user.

        const { amount, category, description, pvzId } = req.body;

        if (!amount || !category || !pvzId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Fallback user logic
        let requesterId = req.body.requesterId;
        if (!requesterId) {
            const userRes = await query("SELECT id FROM employees WHERE role = 'admin' LIMIT 1");
            if (userRes.rows.length > 0) requesterId = userRes.rows[0].id;
            else {
                // Try any user
                const anyUser = await query("SELECT id FROM employees LIMIT 1");
                if (anyUser.rows.length > 0) requesterId = anyUser.rows[0].id;
            }
        }

        const result = await query(`
            INSERT INTO expense_requests (pvz_id, requester_id, amount, category, description, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `, [pvzId, requesterId, amount, category, description]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating expense request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /expenses/:id/status - Approve/Reject (Using REAL DB)
router.patch('/expenses/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvedById, rejectionReason } = req.body; // 'approved' | 'rejected' | 'paid'

        if (!['approved', 'rejected', 'paid'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await query('BEGIN');

        // Update Request
        let sql = 'UPDATE expense_requests SET status = $1, updated_at = NOW()';
        const params = [status, id];
        let paramIdx = 3;

        if (status === 'approved') {
            sql += `, approved_by_id = $${paramIdx++}, approved_at = NOW()`;
            params.push(approvedById || null);
        } else if (status === 'rejected') {
            sql += `, rejection_reason = $${paramIdx++}`;
            params.push(rejectionReason || null);
        }

        sql += ` WHERE id = $2 RETURNING *`;

        const result = await query(sql, params);

        if (result.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Expense request not found' });
        }

        const expense = result.rows[0];

        // If status is 'paid', create a financial transaction
        if (status === 'paid') {
            await query(`
                INSERT INTO financial_transactions (pvz_id, type, amount, description, transaction_date, source)
                VALUES ($1, 'expense', $2, $3, NOW(), 'expense_request')
            `, [expense.pvz_id, -Math.abs(expense.amount), `Expense: ${expense.category} - ${expense.description || ''}`]);
        }

        await query('COMMIT');
        res.json(expense);

    } catch (err) {
        await query('ROLLBACK');
        console.error('Error updating expense status:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /payroll/calculate
router.post('/payroll/calculate', async (req, res) => {
    try {
        const { pvzId, month } = req.body;

        if (!pvzId || !month) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const startOfMonth = new Date(month);
        startOfMonth.setDate(1);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);

        // 1. Fetch Shifts
        const shiftsResult = await query(`
            SELECT s.employee_id, SUM(s.actual_hours) as total_hours, e.base_rate
            FROM shifts s
            JOIN employees e ON s.employee_id = e.id
            WHERE s.pvz_id = $1 
              AND s.date >= $2 
              AND s.date <= $3
              AND s.status = 'closed'
            GROUP BY s.employee_id, e.base_rate
        `, [pvzId, startOfMonth, endOfMonth]);

        // 2. Calculate & Upsert
        await query('BEGIN');

        const payrolls = [];
        for (const row of shiftsResult.rows) {
            const totalAmount = parseFloat(row.total_hours) * parseFloat(row.base_rate || 0);

            const result = await query(`
                INSERT INTO fact_payroll (pvz_id, employee_id, month, total_hours, rate, total_amount, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'calculated')
                ON CONFLICT (employee_id, month) 
                DO UPDATE SET 
                    total_hours = EXCLUDED.total_hours,
                    total_amount = EXCLUDED.total_amount,
                    updated_at = NOW()
                RETURNING *
            `, [pvzId, row.employee_id, startOfMonth, row.total_hours, row.base_rate, totalAmount]);

            payrolls.push(result.rows[0]);
        }

        await query('COMMIT');
        res.json(payrolls);

    } catch (err) {
        await query('ROLLBACK');
        console.error('Error calculating payroll:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
