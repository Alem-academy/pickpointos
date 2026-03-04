import express from 'express';
import multer from 'multer';
import { query } from '../lib/db.js';
import { CONTRACT_TEMPLATE, HIRING_ORDER_TEMPLATE, EMPLOYMENT_APPLICATION_TEMPLATE, fillTemplate } from '../services/templates.js';
import { storageService } from '../services/storage.service.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /employees/:id/documents - List documents for employee
router.get('/employees/:id/documents', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM documents WHERE employee_id = $1 ORDER BY created_at DESC', [id]);

        // Enhance documents with signed URLs if they are stored in S3
        const documents = await Promise.all(result.rows.map(async (doc) => {
            let enhanced = { ...doc };
            if (doc.scan_url && !doc.scan_url.startsWith('http')) {
                try {
                    enhanced.scan_url = await storageService.getFileUrl(doc.scan_url);
                } catch (e) {
                    console.error(`Failed to sign scan_url for doc ${doc.id}:`, e);
                }
            }
            if (doc.thumbnail_url && !doc.thumbnail_url.startsWith('http')) {
                try {
                    enhanced.thumbnail_url = await storageService.getFileUrl(doc.thumbnail_url);
                } catch (e) {
                    console.error(`Failed to sign thumbnail_url for doc ${doc.id}:`, e);
                }
            }
            return enhanced;
        }));

        res.set('Cache-Control', 'no-store');
        res.json(documents);
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /documents/upload - Upload a new document scan
router.post('/documents/upload', upload.single('file'), async (req, res) => {
    try {
        const { employeeId, type } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!employeeId || !type) {
            return res.status(400).json({ error: 'Employee ID and Type are required' });
        }

        // Generate a clean filename/key
        // e.g. documents/emp_123/scan_contract_1700000000.pdf
        const ext = file.originalname.split('.').pop();
        const key = `documents/${employeeId}/scan_${type}_${Date.now()}.${ext}`;

        // Upload to S3
        await storageService.uploadFile(file.buffer, file.mimetype, key);

        // Generate a lightweight thumbnail for images (optional — requires sharp)
        let thumbnailKey = null;
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            try {
                const { default: sharp } = await import('sharp');
                const thumbBuffer = await sharp(file.buffer)
                    .resize({ width: 400, height: 300, fit: 'cover', position: 'centre' })
                    .webp({ quality: 75 })
                    .toBuffer();
                thumbnailKey = `thumbnails/${employeeId}/thumb_${type}_${Date.now()}.webp`;
                await storageService.uploadFile(thumbBuffer, 'image/webp', thumbnailKey);
            } catch (thumbErr) {
                console.warn('Thumbnail generation skipped (sharp unavailable or error):', thumbErr.message);
            }
        }

        // Record in DB
        const result = await query(`
            INSERT INTO documents (employee_id, type, status, scan_url, thumbnail_url, created_at)
            VALUES ($1, $2, 'signed', $3, $4, NOW())
            RETURNING *
        `, [employeeId, type, key, thumbnailKey]);

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Upload failed:', err);
        res.status(500).json({ error: 'Upload failed', details: err.message });
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
        const { employeeId, type, iban } = req.body;

        // If an IBAN is provided, save it to the employee
        if (iban) {
            await query('UPDATE employees SET iban = $1 WHERE id = $2', [iban, employeeId]);
        }

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

        // ─── Employer constants ───────────────────────────────────────────
        const EMPLOYER = {
            name: 'AlemLab PickPoint',
            bin: '230540009760',
            director: 'Жалелов А.К.',
            address: 'г. Алматы, ул. Байзакова 280',
            bank: 'АО «Kaspi Bank»',
            iban: 'KZ54722S000009084425',
        };

        // ─── Date helpers ──────────────────────────────────────────────────
        const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const now = new Date();
        const contractDay = String(now.getDate()).padStart(2, '0');
        const contractMonth = MONTHS_RU[now.getMonth()];
        const contractYear = now.getFullYear();
        const dateRu = `${contractDay} ${contractMonth} ${contractYear}`;

        // ─── Contract number ───────────────────────────────────────────────
        // Count existing contracts for this employee to get sequence
        const cntRes = await query(
            `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type = 'contract'`, [employeeId]
        );
        const seq = parseInt(cntRes.rows[0].count, 10) + 1;
        const yearShort = String(contractYear).slice(-2);
        const contractNum = `ТД-${String(seq).padStart(3, '0')}/${yearShort}`;

        if (type === 'contract') {
            htmlContent = fillTemplate(CONTRACT_TEMPLATE, {
                contract_number: contractNum,
                contract_day: contractDay,
                contract_month: contractMonth,
                contract_year: String(contractYear),
                // Employer
                employer_name: EMPLOYER.name,
                employer_bin: EMPLOYER.bin,
                employer_director: EMPLOYER.director,
                employer_address: EMPLOYER.address,
                employer_bank: EMPLOYER.bank,
                employer_iban: EMPLOYER.iban,
                // Employee
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                id_number: emp.id_number || '__________',
                address: emp.address || 'не указан',
                iban: emp.iban || 'не указан',
                position: emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ',
                pvz_address: emp.pvz_address || 'не указан',
                start_date: dateRu,
                base_rate: emp.base_rate ? Number(emp.base_rate).toLocaleString('ru-RU') : '0',
            });
        } else if (type === 'order_hiring') {
            const contractRes = await query(
                `SELECT id, created_at FROM documents WHERE employee_id = $1 AND type = 'contract' ORDER BY created_at DESC LIMIT 1`,
                [employeeId]
            );
            const existingNum = contractRes.rows.length > 0 ? `ТД-001/${yearShort}` : '_______';
            const existingDate = contractRes.rows.length > 0
                ? new Date(contractRes.rows[0].created_at).toLocaleDateString('ru-RU') : '_______';

            htmlContent = fillTemplate(HIRING_ORDER_TEMPLATE, {
                order_number: `П-${String(seq).padStart(3, '0')}/${yearShort}`,
                contract_number: existingNum,
                date: existingDate,
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                position: emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ',
                pvz_address: emp.pvz_address || 'не указан',
                start_date: dateRu,
                base_rate: emp.base_rate ? Number(emp.base_rate).toLocaleString('ru-RU') : '0',
            });
        } else if (type === 'application') {
            htmlContent = fillTemplate(EMPLOYMENT_APPLICATION_TEMPLATE, {
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                phone: emp.phone || '_____________',
                position: emp.role === 'rf' ? 'Регионального менеджера' : 'Менеджера ПВЗ',
                pvz_address: emp.pvz_address || '_____________',
                date: dateRu,
            });
        } else {
            return res.status(400).json({ error: 'Unsupported document type' });
        }

        // Save generated HTML to S3 so it can be re-read later
        const htmlKey = `documents/${employeeId}/${type}_${Date.now()}.html`;
        await storageService.uploadFile(Buffer.from(htmlContent, 'utf-8'), 'text/html', htmlKey);

        const docResult = await query(`
            INSERT INTO documents (employee_id, type, status, scan_url, created_at)
            VALUES ($1, $2, 'draft', $3, NOW())
            RETURNING *
        `, [employeeId, type, htmlKey]);

        res.status(201).json({
            document: docResult.rows[0],
            content: htmlContent
        });

    } catch (err) {
        console.error('Error generating document:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /documents/:id/content - Get signed URL to re-read a generated document
router.get('/documents/:id/content', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        const doc = result.rows[0];
        if (!doc.scan_url) {
            return res.status(404).json({ error: 'No content stored for this document' });
        }
        const signedUrl = doc.scan_url.startsWith('http')
            ? doc.scan_url
            : await storageService.getFileUrl(doc.scan_url);
        res.json({ scan_url: signedUrl });
    } catch (err) {
        console.error('Error fetching document content:', err);
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
