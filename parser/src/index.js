import express from 'express';
import dotenv from 'dotenv';
import { createClient } from './db-client.js';
import { parseSheet } from './parser.js';
import redis from './redis-client.js';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.send('OK');
});

// --- HR API Endpoints ---

// GET /pvz - List all PVZ points
app.get('/pvz', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const result = await client.query('SELECT id, name, address, brand FROM pvz_points ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching PVZ:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET /employees - List employees with filters
app.get('/employees', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, status, search } = req.query;

        let query = `
            SELECT e.*, p.name as main_pvz_name 
            FROM employees e 
            LEFT JOIN pvz_points p ON e.main_pvz_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (pvzId) {
            query += ` AND e.main_pvz_id = $${paramIdx++}`;
            params.push(pvzId);
        }
        if (status) {
            query += ` AND e.status = $${paramIdx++}`;
            params.push(status);
        }
        if (search) {
            query += ` AND (e.full_name ILIKE $${paramIdx++} OR e.phone ILIKE $${paramIdx++} OR e.iin ILIKE $${paramIdx++})`;
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }

        query += ' ORDER BY e.created_at DESC';

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /employees - Create new employee
app.post('/employees', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { iin, full_name, phone, email, role, main_pvz_id, status, address, base_rate, probation_until, hired_at } = req.body;

        // Basic validation
        if (!iin || !full_name || !role) {
            return res.status(400).json({ error: 'Missing required fields (IIN, Full Name, Role)' });
        }

        const result = await client.query(`
            INSERT INTO employees (
                iin, full_name, phone, email, role, main_pvz_id, status,
                address, base_rate, probation_until, hired_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            iin,
            fullName,
            phone,
            email,
            role,
            main_pvz_id || null,
            status || 'new',
            address || null,
            base_rate || null,
            probation_until || null,
            hired_at || null
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating employee:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        await client.end();
    }
});

// GET /employees/:id - Get single employee details
app.get('/employees/:id', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;

        const result = await client.query(`
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
        console.error('Error fetching employee:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// PATCH /employees/:id/status - Update employee status
app.patch('/employees/:id/status', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        // Prepare update query
        let query = 'UPDATE employees SET status = $1, updated_at = NOW()';
        const params = [status, id];
        let paramIdx = 3;

        // Set timestamps based on status
        if (status === 'active') {
            query += `, hired_at = COALESCE(hired_at, NOW())`;
        } else if (status === 'fired') {
            query += `, fired_at = COALESCE(fired_at, NOW())`;
        }

        query += ` WHERE id = $2 RETURNING *`;

        const result = await client.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating employee status:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /employees/:id/transfer - Transfer employee to another PVZ
app.post('/employees/:id/transfer', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;
        const { pvzId, date, comment } = req.body;

        if (!pvzId || !date) {
            return res.status(400).json({ error: 'PVZ ID and Date are required' });
        }

        // Update employee's main PVZ
        const result = await client.query(`
            UPDATE employees 
            SET main_pvz_id = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [pvzId, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // TODO: Log transfer history in a separate table if needed
        console.log(`Employee ${id} transferred to PVZ ${pvzId} on ${date}. Comment: ${comment}`);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error transferring employee:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET /timesheets - Get aggregated timesheet data
app.get('/timesheets', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { month, pvzId } = req.query; // month in YYYY-MM format

        if (!month) {
            return res.status(400).json({ error: 'Month is required' });
        }

        let query = `
            SELECT 
                s.id, s.employee_id, s.pvz_id, s.date, s.type, s.status, s.planned_hours, s.fact_hours,
                e.full_name as employee_name,
                p.name as pvz_name
            FROM shifts s
            JOIN employees e ON s.employee_id = e.id
            JOIN pvz p ON s.pvz_id = p.id
            WHERE to_char(s.date, 'YYYY-MM') = $1
        `;
        const params = [month];

        if (pvzId) {
            query += ` AND s.pvz_id = $2`;
            params.push(pvzId);
        }

        query += ` ORDER BY s.date ASC`;

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching timesheets:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /timesheets/approve - Approve timesheet for a month
app.post('/timesheets/approve', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { month, pvzId } = req.body;

        if (!month) {
            return res.status(400).json({ error: 'Month is required' });
        }

        let query = `
            UPDATE shifts 
            SET status = 'approved', updated_at = NOW()
            WHERE to_char(date, 'YYYY-MM') = $1 AND status != 'approved'
        `;
        const params = [month];

        if (pvzId) {
            query += ` AND pvz_id = $2`;
            params.push(pvzId);
        }

        const result = await client.query(query, params);
        res.json({ message: 'Timesheet approved', updatedCount: result.rowCount });
    } catch (err) {
        console.error('Error approving timesheet:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Discipline & Motivation ---

// POST /discipline - Create a disciplinary record
app.post('/discipline', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { employeeId, type, reason, comment, date } = req.body;

        if (!employeeId || !type || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Mock implementation: just log it for now as we don't have a table yet
        // In a real app, INSERT INTO discipline_records ...
        console.log(`Discipline record created: ${type} for ${employeeId} on ${date}. Reason: ${reason}`);

        res.json({ id: 'mock-discipline-id-' + Date.now(), ...req.body });
    } catch (err) {
        console.error('Error creating discipline record:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET /discipline - Get disciplinary records
app.get('/discipline', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
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
        console.error('Error fetching discipline records:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET /motivation/bonuses - Calculate tenure bonuses
app.get('/motivation/bonuses', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();

        // Fetch active employees with their hire dates
        const result = await client.query(`
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
        console.error('Error calculating bonuses:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Finance: Rent & Lease ---

// GET /finance/rent - List rent details for all PVZs
app.get('/finance/rent', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();

        // Mock data for now, ideally this comes from a 'leases' table
        // We'll join with PVZ table to get names
        const result = await client.query('SELECT id, name, address FROM pvz_points');

        const rentData = result.rows.map(pvz => {
            // Mock logic: Rent is based on ID length * 50000 for variety
            const rentAmount = 150000 + (pvz.id.length * 10000);
            const isPaid = Math.random() > 0.3; // Random status

            return {
                pvzId: pvz.id,
                pvzName: pvz.name,
                address: pvz.address,
                landlord: 'ИП Арендодатель ' + pvz.id.substring(0, 4),
                amount: rentAmount,
                dueDate: new Date().toISOString().split('T')[0], // Due today for MVP
                status: isPaid ? 'paid' : 'pending'
            };
        });

        res.json(rentData);
    } catch (err) {
        console.error('Error fetching rent data:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /finance/rent/pay - Record a rent payment
app.post('/finance/rent/pay', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, month, amount } = req.body;

        if (!pvzId || !month || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Mock implementation: just log it
        console.log(`Rent paid for PVZ ${pvzId}, Month: ${month}, Amount: ${amount}`);

        res.json({ success: true, message: 'Payment recorded' });
    } catch (err) {
        console.error('Error paying rent:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Finance: Operational Expenses (OpEx) ---

// GET /finance/expenses - List expenses
app.get('/finance/expenses', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { status } = req.query;

        // Mock data
        const today = new Date().toISOString().split('T')[0];
        let expenses = [
            { id: '1', category: 'office', description: 'Paper & Pens', amount: 15000, created_at: today, status: 'approved', pvz_id: 'PVZ-001' },
            { id: '2', category: 'repair', description: 'Printer Repair', amount: 25000, created_at: today, status: 'pending', pvz_id: 'PVZ-002' },
            { id: '3', category: 'other', description: 'Coffee for clients', amount: 5000, created_at: today, status: 'rejected', pvz_id: 'PVZ-001' }
        ];

        if (status) {
            expenses = expenses.filter(e => e.status === status);
        }

        res.json(expenses);
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /finance/expenses - Create expense request
app.post('/finance/expenses', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { amount, category, description, pvzId } = req.body;

        if (!amount || !category || !pvzId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newExpense = {
            id: 'exp-' + Date.now(),
            amount,
            category,
            description,
            pvz_id: pvzId,
            created_at: new Date().toISOString().split('T')[0],
            status: 'pending'
        };

        // Mock: just log
        console.log('New Expense:', newExpense);

        res.json(newExpense);
    } catch (err) {
        console.error('Error creating expense:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// PATCH /finance/expenses/:id/status - Approve/Reject
app.patch('/finance/expenses/:id/status', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;
        const { status } = req.body; // 'approved' | 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Mock implementation
        console.log(`Expense ${id} status updated to ${status}`);

        res.json({ success: true, id, status });
    } catch (err) {
        console.error('Error updating expense status:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Document API Endpoints ---

import { CONTRACT_TEMPLATE, HIRING_ORDER_TEMPLATE, fillTemplate } from './services/templates.js';

// GET /employees/:id/documents - List documents for employee
app.get('/employees/:id/documents', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;
        const result = await client.query('SELECT * FROM documents WHERE employee_id = $1 ORDER BY created_at DESC', [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET /documents/stats - Get document statistics
app.get('/documents/stats', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const result = await client.query(`
            SELECT COUNT(*) as count 
            FROM documents 
            WHERE status IN ('sent_to_employee', 'signed')
        `);
        res.json({ pending: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error fetching document stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /documents/generate - Generate a new document (Contract)
app.post('/documents/generate', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { employeeId, type } = req.body;

        // Fetch employee data
        const empResult = await client.query(`
            SELECT e.*, p.name as pvz_name, p.address as pvz_address 
            FROM employees e 
            LEFT JOIN pvz_points p ON e.main_pvz_id = p.id 
            WHERE e.id = $1
        `, [employeeId]);

        if (empResult.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        const emp = empResult.rows[0];

        let htmlContent = '';
        let docType = type;

        if (type === 'contract') {
            htmlContent = fillTemplate(CONTRACT_TEMPLATE, {
                contract_number: `TR-${emp.id.slice(0, 8).toUpperCase()}`,
                date: new Date().toLocaleDateString('ru-RU'),
                full_name: emp.full_name,
                iin: emp.iin,
                position: emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ',
                pvz_address: emp.pvz_address || 'Адрес не указан',
                start_date: new Date().toLocaleDateString('ru-RU'),
                base_rate: emp.base_rate || '0'
            });
        } else if (type === 'order_hiring') {
            // Find contract number if exists
            const contractRes = await client.query('SELECT id, created_at FROM documents WHERE employee_id = $1 AND type = \'contract\' LIMIT 1', [employeeId]);
            const contractNum = contractRes.rows.length > 0 ? `TR-${contractRes.rows[0].id.slice(0, 8).toUpperCase()}` : '_______';
            const contractDate = contractRes.rows.length > 0 ? new Date(contractRes.rows[0].created_at).toLocaleDateString('ru-RU') : '_______';

            htmlContent = fillTemplate(HIRING_ORDER_TEMPLATE, {
                order_number: `ORD-${Date.now().toString().slice(-6)}`,
                contract_number: contractNum,
                date: contractDate,
                full_name: emp.full_name,
                iin: emp.iin,
                position: emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ',
                pvz_address: emp.pvz_address || 'Адрес не указан',
                start_date: new Date().toLocaleDateString('ru-RU'),
                base_rate: emp.base_rate || '0'
            });
        } else {
            return res.status(400).json({ error: 'Unsupported document type' });
        }

        // Save to DB
        // In a real app, we would upload the HTML/PDF to Cloud Storage and save the URL.
        // Here we will save the HTML content directly in scan_url (as a data URI or just text for MVP)
        // OR just save a placeholder URL since we generate it on the fly.
        // Let's save a placeholder and return the content in the response for preview.

        const docResult = await client.query(`
            INSERT INTO documents (employee_id, type, status, created_at)
            VALUES ($1, $2, 'draft', NOW())
            RETURNING *
        `, [employeeId, type]);

        res.status(201).json({
            document: docResult.rows[0],
            content: htmlContent // Return content for frontend preview
        });

    } catch (err) {
        console.error('Error generating document:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /documents/:id/sign - Sign a document (Mock eGov)
app.post('/documents/:id/sign', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;
        const { signature, signType } = req.body; // Optional: store signature data

        // In a real implementation, we would verify the signature here using Sigex or NCALayer
        // For now, we trust the client if they send a signature (or just mock it)

        const result = await client.query(`
            UPDATE documents 
            SET status = 'signed', signed_at = NOW(), external_id = $1
            WHERE id = $2
            RETURNING *
        `, [`SIGEX-${Date.now()}`, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Also update employee status to 'active' if it was 'signing'
        // ONLY if this was the Contract or Hiring Order
        const docType = result.rows[0].type;
        if (['contract', 'order_hiring'].includes(docType)) {
            await client.query(`
                UPDATE employees 
                SET status = 'active', hired_at = COALESCE(hired_at, NOW())
                WHERE id = (SELECT employee_id FROM documents WHERE id = $1) 
                AND status = 'signing'
            `, [id]);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error signing document:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Shift API Endpoints ---

// GET /shifts - List shifts
app.get('/shifts', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, start, end } = req.query;

        let query = `
            SELECT s.*, e.full_name, e.role 
            FROM shifts s
            JOIN employees e ON s.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (pvzId) {
            query += ` AND s.pvz_id = $${paramIdx++}`;
            params.push(pvzId);
        }
        if (start) {
            query += ` AND s.date >= $${paramIdx++}`;
            params.push(start);
        }
        if (end) {
            query += ` AND s.date <= $${paramIdx++}`;
            params.push(end);
        }

        query += ' ORDER BY s.date ASC';

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching shifts:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /shifts - Create a single shift manually
app.post('/shifts', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { employeeId, pvzId, date, type, status, plannedHours } = req.body;

        if (!employeeId || !pvzId || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await client.query(`
            INSERT INTO shifts (employee_id, pvz_id, date, type, status, planned_hours)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [employeeId, pvzId, date, type || 'work', status || 'pending', plannedHours || 12]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating shift:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        await client.end();
    }
});

// PATCH /shifts/:id - Update a shift
app.patch('/shifts/:id', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;
        const { employeeId, date, type, status, plannedHours, factHours } = req.body;

        let query = 'UPDATE shifts SET updated_at = NOW()';
        const params = [id];
        let paramIdx = 2;

        if (employeeId) { query += `, employee_id = $${paramIdx++}`; params.push(employeeId); }
        if (date) { query += `, date = $${paramIdx++}`; params.push(date); }
        if (type) { query += `, type = $${paramIdx++}`; params.push(type); }
        if (status) { query += `, status = $${paramIdx++}`; params.push(status); }
        if (plannedHours !== undefined) { query += `, planned_hours = $${paramIdx++}`; params.push(plannedHours); }
        if (factHours !== undefined) { query += `, fact_hours = $${paramIdx++}`; params.push(factHours); }

        query += ` WHERE id = $1 RETURNING *`;

        const result = await client.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating shift:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// DELETE /shifts/:id - Delete a shift
app.delete('/shifts/:id', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;

        const result = await client.query('DELETE FROM shifts WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.json({ message: 'Shift deleted', id });
    } catch (err) {
        console.error('Error deleting shift:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /shifts/generate - Generate A/B Schedule
app.post('/shifts/generate', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, teamA, teamB, startDate, endDate } = req.body;

        if (!pvzId || !teamA || !teamB || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const shifts = [];
        let current = new Date(start);

        // 0 = Team A (Day 1), 1 = Team A (Day 2), 2 = Team B (Day 3), 3 = Team B (Day 4)
        // We need to know the "cycle day" relative to some epoch or just start from 0 for this generation block.
        // For simplicity, we assume the generation starts on a "Day 1" of the cycle.
        // A better approach is to ask "Is this start date Day 1, 2, 3 or 4 of the cycle?"
        // Let's assume standard 2/2 starting from startDate.

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
        // Note: ON CONFLICT DO NOTHING to avoid breaking if some shifts exist
        let insertedCount = 0;

        await client.query('BEGIN');

        for (const shift of shifts) {
            const result = await client.query(`
                INSERT INTO shifts (employee_id, pvz_id, date, type, status)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (employee_id, date) DO NOTHING
                RETURNING id
            `, [shift.employee_id, shift.pvz_id, shift.date, shift.type, shift.status]);

            if (result.rows.length > 0) insertedCount++;
        }

        await client.query('COMMIT');

        res.json({ message: 'Schedule generated', generated: insertedCount, total_days: shifts.length });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error generating schedule:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- OpEx API Endpoints ---

// GET /expenses - List expense requests
app.get('/expenses', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, status } = req.query;

        let query = `
            SELECT er.*, e.full_name as requester_name, p.name as pvz_name
            FROM expense_requests er
            JOIN employees e ON er.requester_id = e.id
            JOIN pvz_points p ON er.pvz_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIdx = 1;

        if (pvzId) {
            query += ` AND er.pvz_id = $${paramIdx++}`;
            params.push(pvzId);
        }
        if (status) {
            query += ` AND er.status = $${paramIdx++}`;
            params.push(status);
        }

        query += ' ORDER BY er.created_at DESC';

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST /expenses/request - Create expense request
app.post('/expenses/request', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, requesterId, amount, category, description } = req.body;

        if (!pvzId || !requesterId || !amount || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await client.query(`
            INSERT INTO expense_requests (pvz_id, requester_id, amount, category, description, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `, [pvzId, requesterId, amount, category, description]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating expense request:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// PATCH /expenses/:id/status - Approve/Reject/Pay
app.patch('/expenses/:id/status', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { id } = req.params;
        const { status, approvedById, rejectionReason } = req.body;

        if (!['approved', 'rejected', 'paid'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await client.query('BEGIN');

        // Update Request
        let updateQuery = 'UPDATE expense_requests SET status = $1, updated_at = NOW()';
        const params = [status, id];
        let paramIdx = 3;

        if (status === 'approved') {
            updateQuery += `, approved_by_id = $${paramIdx++}, approved_at = NOW()`;
            params.push(approvedById);
        } else if (status === 'rejected') {
            updateQuery += `, rejection_reason = $${paramIdx++}`;
            params.push(rejectionReason);
        }

        updateQuery += ` WHERE id = $2 RETURNING *`;

        const result = await client.query(updateQuery, params);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Expense request not found' });
        }

        const expense = result.rows[0];

        // If status is 'paid', create a financial transaction
        if (status === 'paid') {
            await client.query(`
                INSERT INTO financial_transactions (pvz_id, type, amount, description, transaction_date, source)
                VALUES ($1, 'expense', $2, $3, NOW(), 'expense_request')
            `, [expense.pvz_id, -Math.abs(expense.amount), `Expense: ${expense.category} - ${expense.description || ''}`]);
        }

        await client.query('COMMIT');
        res.json(expense);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating expense status:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Payroll & P&L API Endpoints ---

// POST /payroll/calculate - Calculate Monthly Payroll
app.post('/payroll/calculate', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, month } = req.body; // month: '2023-11-01'

        if (!pvzId || !month) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const startOfMonth = new Date(month);
        startOfMonth.setDate(1); // Ensure 1st
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0); // Last day

        // 1. Fetch Shifts
        const shiftsResult = await client.query(`
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
        await client.query('BEGIN');

        const payrolls = [];
        for (const row of shiftsResult.rows) {
            const totalAmount = parseFloat(row.total_hours) * parseFloat(row.base_rate || 0);

            const result = await client.query(`
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

        await client.query('COMMIT');
        res.json(payrolls);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error calculating payroll:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET /reports/pnl - Profit & Loss Report
app.get('/reports/pnl', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { pvzId, month } = req.query; // month: '2023-11-01'

        if (!pvzId || !month) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const startOfMonth = new Date(month);
        startOfMonth.setDate(1);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);

        // 1. Revenue (WB + Manual)
        // For MVP we just sum manual transactions type='revenue'
        const revenueRes = await client.query(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM financial_transactions
            WHERE pvz_id = $1 
              AND transaction_date >= $2 
              AND transaction_date <= $3
              AND type = 'revenue'
        `, [pvzId, startOfMonth, endOfMonth]);

        // 2. OpEx (Expenses)
        const opexRes = await client.query(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM financial_transactions
            WHERE pvz_id = $1 
              AND transaction_date >= $2 
              AND transaction_date <= $3
              AND type = 'expense'
        `, [pvzId, startOfMonth, endOfMonth]);

        // 3. Payroll (Calculated)
        const payrollRes = await client.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM fact_payroll
            WHERE pvz_id = $1 
              AND month = $2
        `, [pvzId, startOfMonth]);

        const revenue = parseFloat(revenueRes.rows[0].total);
        const opex = Math.abs(parseFloat(opexRes.rows[0].total)); // Expenses are stored as negative usually, but let's handle absolute
        const payroll = parseFloat(payrollRes.rows[0].total);

        const netProfit = revenue - opex - payroll;

        res.json({
            month: startOfMonth,
            revenue,
            opex,
            payroll,
            netProfit
        });

    } catch (err) {
        console.error('Error fetching P&L:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Mapping API Endpoints ---

app.post('/mappings', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const { name, mapping, isActive } = req.body;

        if (!name || !mapping) {
            return res.status(400).json({ error: 'Name and mapping are required' });
        }

        const result = await client.query(`
            INSERT INTO import_mappings (name, mapping, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [name, mapping, isActive !== undefined ? isActive : true]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating mapping:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

app.get('/mappings', async (req, res) => {
    const client = createClient();
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM import_mappings ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching mappings:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// --- Parser Endpoint ---

app.post('/parse', async (req, res) => {
    try {
        const sheetId = req.body.sheetId || process.env.GOOGLE_SHEET_ID;
        if (!sheetId) {
            return res.status(400).json({ error: 'Sheet ID is required' });
        }

        console.log(`🚀 Starting parse for sheet: ${sheetId}`);

        const result = await parseSheet(sheetId);

        res.status(200).json({
            message: 'Parsing completed successfully',
            stats: result
        });
    } catch (error) {
        console.error('❌ Error during parsing:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// --- Analytics Dashboard API ---

app.get('/analytics/dashboard', async (req, res) => {
    const client = createClient();
    try {
        // Try to get from cache first
        const { month } = req.query;
        const cacheKey = `analytics:dashboard:${month || 'current'}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            console.log('Serving analytics from cache');
            return res.json(JSON.parse(cachedData));
        }

        await client.connect();
        // const { month } = req.query; // Already destructured above

        const now = new Date();
        const targetDate = month ? new Date(month) : now;
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        // 1. Aggregates
        const financialsRes = await client.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as opex
            FROM financial_transactions
            WHERE transaction_date >= $1 AND transaction_date <= $2
        `, [startOfMonth, endOfMonth]);

        const payrollRes = await client.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM fact_payroll
            WHERE month = $1
        `, [startOfMonth]);

        const revenue = parseFloat(financialsRes.rows[0].revenue);
        const opex = Math.abs(parseFloat(financialsRes.rows[0].opex));
        const payroll = parseFloat(payrollRes.rows[0].total);
        const netProfit = revenue - opex - payroll;

        // 2. Check for Parser Data (Missing Data Warning)
        const parserCheckRes = await client.query(`
            SELECT EXISTS(
                SELECT 1 FROM financial_transactions 
                WHERE source = 'wb_sheet' 
                AND transaction_date >= $1 AND transaction_date <= $2
            ) as has_parser_data
        `, [startOfMonth, endOfMonth]);

        const hasParserData = parserCheckRes.rows[0].has_parser_data;

        // 3. Top PVZ
        const topPvzRes = await client.query(`
            SELECT p.name, COALESCE(SUM(ft.amount), 0) as revenue
            FROM pvz_points p
            LEFT JOIN financial_transactions ft ON p.id = ft.pvz_id 
                AND ft.type = 'revenue' 
                AND ft.transaction_date >= $1 AND ft.transaction_date <= $2
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 5
        `, [startOfMonth, endOfMonth]);

        // 4. Recent Activity (Mock + Real mix)
        // For now, just fetching latest transactions
        const activityRes = await client.query(`
            SELECT 
                ft.id,
                ft.type as action,
                ft.description as detail,
                to_char(ft.created_at, 'HH24:MI') as time
            FROM financial_transactions ft
            ORDER BY ft.created_at DESC
            LIMIT 5
        `);

        // If no real activity, provide some mocks for UI testing
        let recentActivity = activityRes.rows.map(r => ({
            id: r.id,
            action: r.action === 'revenue' ? 'Поступление' : 'Расход',
            detail: r.detail || 'Финансовая операция',
            time: r.time
        }));

        if (recentActivity.length === 0) {
            recentActivity = [
                { id: 'm1', action: 'Система', detail: 'Синхронизация данных', time: '10:00' },
                { id: 'm2', action: 'HR', detail: 'Новый кандидат', time: '09:45' }
            ];
        }

        const responseData = {
            revenue,
            opex,
            payroll,
            netProfit,
            hasParserData, // Flag for frontend warning
            isIntermediate: !hasParserData, // If no parser data, calculations are intermediate
            topPvz: topPvzRes.rows,
            recentActivity
        };

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(responseData));

        res.json(responseData);

    } catch (err) {
        console.error('Error fetching analytics dashboard:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
