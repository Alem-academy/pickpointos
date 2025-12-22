import express from 'express';
import { query } from '../db-client.js';
import { CONTRACT_TEMPLATE, HIRING_ORDER_TEMPLATE, fillTemplate } from '../services/templates.js';

const router = express.Router();

// GET /employees/:id/documents - List documents for employee
router.get('/employees/:id/documents', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM documents WHERE employee_id = $1 ORDER BY created_at DESC', [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /documents/stats - Get document statistics
router.get('/documents/stats', async (req, res) => {
    try {
        const result = await query(`
            SELECT COUNT(*) as count 
            FROM documents 
            WHERE status IN ('sent_to_employee', 'signed')
        `);
        res.json({ pending: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error fetching document stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /documents/generate - Generate a new document (Contract)
router.post('/documents/generate', async (req, res) => {
    try {
        const { employeeId, type } = req.body;

        // Fetch employee data
        const empResult = await query(`
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
            const contractRes = await query('SELECT id, created_at FROM documents WHERE employee_id = $1 AND type = \'contract\' LIMIT 1', [employeeId]);
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

        const docResult = await query(`
            INSERT INTO documents (employee_id, type, status, created_at)
            VALUES ($1, $2, 'draft', NOW())
            RETURNING *
        `, [employeeId, type]);

        res.status(201).json({
            document: docResult.rows[0],
            content: htmlContent
        });

    } catch (err) {
        console.error('Error generating document:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /documents/:id/sign - Sign a document (Mock eGov)
router.post('/documents/:id/sign', async (req, res) => {
    try {
        const { id } = req.params;
        const { signature, signType } = req.body;

        const result = await query(`
            UPDATE documents 
            SET status = 'signed', signed_at = NOW(), external_id = $1
            WHERE id = $2
            RETURNING *
        `, [`SIGEX-${Date.now()}`, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Also update employee status to 'active' if it was 'signing'
        const docType = result.rows[0].type;
        if (['contract', 'order_hiring'].includes(docType)) {
            await query(`
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
    }
});

// --- Mappings ---

router.post('/mappings', async (req, res) => {
    try {
        const { name, mapping, isActive } = req.body;

        if (!name || !mapping) {
            return res.status(400).json({ error: 'Name and mapping are required' });
        }

        const result = await query(`
            INSERT INTO import_mappings (name, mapping, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [name, mapping, isActive !== undefined ? isActive : true]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating mapping:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/mappings', async (req, res) => {
    try {
        const result = await query('SELECT * FROM import_mappings ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching mappings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
