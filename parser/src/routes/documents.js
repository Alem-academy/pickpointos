import express from 'express';
import multer from 'multer';
import { query } from '../lib/db.js';
import QRCode from 'qrcode';
import { 
    CONTRACT_TEMPLATE, 
    HIRING_ORDER_TEMPLATE, 
    EMPLOYMENT_APPLICATION_TEMPLATE,
    VACATION_APPLICATION_TEMPLATE,
    VACATION_ORDER_TEMPLATE,
    TERMINATION_ORDER_TEMPLATE,
    EMPLOYMENT_CERTIFICATE_TEMPLATE,
    fillTemplate 
} from '../services/templates.js';
import { storageService } from '../services/storage.service.js';
import { Logger } from '../lib/logger.js';

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
                    Logger.error(`Failed to sign scan_url for doc ${doc.id}:`, e);
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
        Logger.error('Error fetching documents:', err);
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
            Logger.warn(`[Docs] Upload failed: Employee ID (${employeeId}) and Type (${type}) are required`);
            return res.status(400).json({ error: 'Employee ID and Type are required' });
        }

        Logger.info(`[Docs] Uploading document scan for employee ${employeeId}, type: ${type}`);

        // Generate a clean filename/key
        // e.g. documents/emp_123/scan_contract_1700000000.pdf
        const ext = file.originalname.split('.').pop();
        const key = `documents/${employeeId}/scan_${type}_${Date.now()}.${ext}`;

        // Upload to S3
        Logger.info(`[Docs] Uploading to bucket with key: ${key}`);
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
                Logger.info(`[Docs] Thumbnail generated and uploaded to ${thumbnailKey}`);
            } catch (thumbErr) {
                Logger.warn(`[Docs] Thumbnail generation skipped (sharp unavailable or error): ${thumbErr.message}`);
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
        Logger.error('[Docs] Upload failed:', err);
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

// POST /documents/generate - Generate a new document with employer data
// Employer is automatically selected based on employee's main_pvz_id
router.post('/documents/generate', async (req, res) => {
    try {
        const { employeeId, type, iban } = req.body;

        // If an IBAN is provided, save it to the employee
        if (iban) {
            await query('UPDATE employees SET iban = $1 WHERE id = $2', [iban, employeeId]);
        }

        // Fetch employee data WITH employer requisites
        // Employer is determined by the PVZ where the employee works
        const empResult = await query(`
            SELECT e.*, p.name as pvz_name, p.address as pvz_address, p.employer_id as pvz_employer_id,
                   emp.name_full as employer_name,
                   emp.name_short as employer_short_name,
                   emp.bin as employer_bin,
                   emp.iin as employer_iin,
                   emp.director_name as employer_director,
                   emp.director_name_dative as employer_director_dative,
                   emp.address_legal as employer_address,
                   emp.bank_name as employer_bank,
                   emp.bik as employer_bik,
                   emp.iban as employer_iban
            FROM employees e
            LEFT JOIN pvz_points p ON e.main_pvz_id = p.id
            LEFT JOIN employers emp ON (e.employer_id = emp.id OR p.employer_id = emp.id)
            WHERE e.id = $1
        `, [employeeId]);

        if (empResult.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        const emp = empResult.rows[0];

        // Use employer from DB (based on PVZ), or fallback to defaults (ИП «Жасмин»)
        // Data from: Матрица реквизитов - Лист1 (1).csv
        const employer = {
            name: emp.employer_name || 'Индивидуальный предприниматель «Жасмин»',
            short_name: emp.employer_short_name || 'Жасмин',
            bin: emp.employer_bin || emp.employer_iin || '910729401967',
            director_name: emp.employer_director || 'Карабаева Г.Е.',
            director_name_dative: emp.employer_director_dative || 'Карабаевой Г.Е.',
            address: emp.employer_address || 'г.Алматы, Бурундайская, дом 93 А',
            bank: emp.employer_bank || 'АО «Kaspi Bank»',
            bik: emp.employer_bik || 'CASPKZKA',
            iban: emp.employer_iban || 'KZ54722S000009084425',
        };

        let htmlContent = '';

        // ─── Date helpers ──────────────────────────────────────────────────
        const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const MONTHS_KZ = ['қаңтарда', 'ақпанда', 'наурызда', 'сәуірде', 'мамырда', 'маусымда', 'шілдеде', 'тамызда', 'қыркүйекте', 'қазанда', 'қарашада', 'желтоқсанда'];
        const now = new Date();
        const contractDay = String(now.getDate()).padStart(2, '0');
        const contractMonth = MONTHS_RU[now.getMonth()];
        const contractMonthKz = MONTHS_KZ[now.getMonth()];
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
                contract_month_kz: contractMonthKz,
                contract_year: String(contractYear),

                // Employer
                employer_name: employer.name,
                employer_short_name: employer.short_name,
                employer_director: employer.director_name,
                employer_bin: employer.bin,
                employer_bic: employer.bik,
                employer_bank: employer.bank,
                employer_bank_kz: '«Kaspi Bank» АҚ',
                employer_address: employer.address,
                employer_address_kz: 'Алматы қ.',
                employer_iban: employer.iban,

                // Employee
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                id_card_number: emp.id_card_number || '__________',
                id_card_issue_date: emp.id_card_issue_date ? new Date(emp.id_card_issue_date).toLocaleDateString('ru-RU') : '__________',
                id_card_issued_by: emp.id_card_issued_by || '__________',
                id_card_issued_by_kz: emp.id_card_issued_by || '__________',
                registered_address: emp.registered_address || emp.address || '__________',
                phone: emp.phone || '__________',
                email: emp.email || '__________',
                address: emp.address || 'не указан',
                iban: emp.iban || 'не указан',

                // Job Details
                position: emp.role === 'rf' ? 'Региональный менеджер / Өңірлік менеджер' : 'Менеджер ПВЗ / ТҚО менеджері',
                pvz_address: emp.pvz_address || 'не указан',
                start_date: dateRu,
                base_rate: emp.base_rate ? Number(emp.base_rate).toLocaleString('ru-RU') + ' (восемьдесят пять тысяч)' : '85 000 (восемьдесят пять тысяч)',
            });
        } else if (type === 'order_hiring') {
            const contractRes = await query(
                `SELECT id, created_at FROM documents WHERE employee_id = $1 AND type = 'contract' ORDER BY created_at DESC LIMIT 1`,
                [employeeId]
            );
            const existingNum = contractRes.rows.length > 0 ? `ТД-${String(seq).padStart(3, '0')}/${yearShort}` : '_______';
            const existingDate = contractRes.rows.length > 0
                ? new Date(contractRes.rows[0].created_at).toLocaleDateString('ru-RU') : '_______';

            htmlContent = fillTemplate(HIRING_ORDER_TEMPLATE, {
                order_number: `П-${String(seq).padStart(3, '0')}/${yearShort}`,
                order_day: contractDay,
                order_month_kz: contractMonthKz,
                order_year: String(contractYear),
                contract_number: existingNum,
                contract_date: existingDate,
                full_name: emp.full_name,
                start_day: contractDay,
                start_month_kz: contractMonthKz,
                start_year: String(contractYear),
                pvz_address: emp.pvz_address || 'не указан',
                employer_name: employer.name,
                employer_short_name: employer.short_name,
                employer_director: employer.director_name,
                sign_day: contractDay,
                sign_month_kz: contractMonthKz,
                sign_year: String(contractYear),
            });
        } else if (type === 'application') {
            htmlContent = fillTemplate(EMPLOYMENT_APPLICATION_TEMPLATE, {
                full_name: emp.full_name,
                address: emp.address || '__________',
                registered_address: emp.registered_address || emp.address || '__________',
                phone: emp.phone || '__________',
                start_day: contractDay,
                start_month_kz: contractMonthKz,
                start_year: String(contractYear),
                employer_name: employer.name,
                employer_director_dative: employer.director_name_dative,
                date: `${contractDay}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(contractYear).slice(-2)}`,
            });
        } else if (type === 'vacation_application') {
            // Заявление на отпуск
            const { vacationDays = 14, vacationStart, vacationEnd } = req.body;
            const vacStart = vacationStart ? new Date(vacationStart) : now;
            const vacEnd = vacationEnd ? new Date(vacationEnd) : new Date(vacStart.getTime() + vacationDays * 24 * 60 * 60 * 1000);

            htmlContent = fillTemplate(VACATION_APPLICATION_TEMPLATE, {
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                position: emp.role === 'rf' ? 'Регионального менеджера' : 'Менеджера ПВЗ',
                vacation_days: String(vacationDays),
                vacation_start: vacStart.toLocaleDateString('ru-RU'),
                vacation_end: vacEnd.toLocaleDateString('ru-RU'),
                date: dateRu,
                employer_name: employer.name,
            });
        } else if (type === 'vacation_order') {
            // Приказ на отпуск
            const { vacationDays = 14, vacationStart, vacationEnd } = req.body;
            const vacStart = vacationStart ? new Date(vacationStart) : now;
            const vacEnd = vacationEnd ? new Date(vacationEnd) : new Date(vacStart.getTime() + vacationDays * 24 * 60 * 60 * 1000);

            // Generate order number
            const orderCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type LIKE '%order%'`, [employeeId]
            );
            const orderSeq = parseInt(orderCntRes.rows[0].count, 10) + 1;

            htmlContent = fillTemplate(VACATION_ORDER_TEMPLATE, {
                order_number: `ОТ-${String(orderSeq).padStart(3, '0')}/${yearShort}`,
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                position: emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ',
                vacation_days: String(vacationDays),
                vacation_start: vacStart.toLocaleDateString('ru-RU'),
                vacation_end: vacEnd.toLocaleDateString('ru-RU'),
                date: dateRu,
                employer_name: employer.name,
                employer_address: employer.address,
            });
        } else if (type === 'termination_order') {
            // Приказ об увольнении
            const { terminationDate, terminationReason = 'по собственному желанию', contractNumber, contractDate } = req.body;
            const termDate = terminationDate ? new Date(terminationDate) : now;

            // Generate order number
            const orderCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type LIKE '%order%'`, [employeeId]
            );
            const orderSeq = parseInt(orderCntRes.rows[0].count, 10) + 1;

            htmlContent = fillTemplate(TERMINATION_ORDER_TEMPLATE, {
                order_number: `УВ-${String(orderSeq).padStart(3, '0')}/${yearShort}`,
                contract_number: contractNumber || '_______',
                contract_date: contractDate || '_______',
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                position: emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ',
                termination_date: termDate.toLocaleDateString('ru-RU'),
                termination_reason: terminationReason,
                date: dateRu,
                employer_name: employer.name,
                employer_address: employer.address,
            });
        } else if (type === 'employment_certificate') {
            // Справка с места работы
            const { salary = 85000 } = req.body;

            htmlContent = fillTemplate(EMPLOYMENT_CERTIFICATE_TEMPLATE, {
                full_name: emp.full_name,
                iin: emp.iin || '__________',
                position: emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ',
                start_date: emp.hired_at ? new Date(emp.hired_at).toLocaleDateString('ru-RU') : '_______',
                salary: Number(salary).toLocaleString('ru-RU'),
                date: dateRu,
                employer_name: employer.name,
                employer_address: employer.address,
            });
        } else {
            return res.status(400).json({ error: 'Unsupported document type' });
        }

        // Save generated HTML directly to S3 (skip PDF generation for now)
        const htmlBuffer = Buffer.from(htmlContent, 'utf8');
        const htmlKey = `documents/${employeeId}/${type}_${Date.now()}.html`;
        
        try {
            await storageService.uploadFile(htmlBuffer, 'text/html', htmlKey);
            Logger.info('[Docs] Document saved as HTML:', htmlKey);
        } catch (uploadErr) {
            Logger.error('[Docs] S3 upload failed:', uploadErr.message);
            throw uploadErr;
        }

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
        Logger.error('[Docs] Error generating document:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /documents/:id/content - Get document content (HTML or signed URL)
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
        
        // Get signed URL
        const signedUrl = doc.scan_url.startsWith('http')
            ? doc.scan_url
            : await storageService.getFileUrl(doc.scan_url);
        
        // Try to fetch content directly from storage
        try {
            const axios = require('axios');
            const response = await axios.get(signedUrl, { responseType: 'text' });
            res.json({ 
                scan_url: signedUrl,
                content: response.data,
                type: doc.scan_url.endsWith('.pdf') ? 'pdf' : 'html'
            });
        } catch (fetchErr) {
            // If fetch fails, return just the URL
            Logger.warn('Could not fetch document content, returning URL only:', fetchErr.message);
            res.json({ scan_url: signedUrl });
        }
    } catch (err) {
        Logger.error('Error fetching document content:', err);
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
        const doc = result.rows[0];
        if (['contract', 'order_hiring'].includes(docType)) {
            await query(`
                UPDATE employees 
                SET status = 'active', hired_at = COALESCE(hired_at, NOW())
                WHERE id = (SELECT employee_id FROM documents WHERE id = $1) 
                AND status = 'signing'
            `, [id]);
        }

        // Generate Signature Sheet PDF
        try {
            const empQuery = await query('SELECT * FROM employees WHERE id = $1', [doc.employee_id]);
            if (empQuery.rows.length > 0) {
                const emp = empQuery.rows[0];
                const qrUrl = 'https://pvz.alemlab.com/verify/' + doc.id; // Or sigex portal link
                const qrCodeBase64 = await QRCode.toDataURL(qrUrl);
                
                const sigSheetHtml = fillTemplate(SIGNATURE_SHEET_TEMPLATE, {
                    document_name: docType === 'contract' ? 'Трудовой договор' : (docType === 'order_hiring' ? 'Приказ о приеме на работу' : 'Заявление'),
                    document_uuid: doc.external_id || doc.id,
                    employer_name: 'Жасмин',
                    employer_bin: '910 729 401 967',
                    employer_sign_date: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU'),
                    employer_cert_info: 'ТОО / ИП «Жасмин», сертификат GOST',
                    employee_name: emp.full_name,
                    employee_iin: emp.iin || '__________',
                    employee_sign_date: new Date(doc.signed_at).toLocaleDateString('ru-RU') + ' ' + new Date(doc.signed_at).toLocaleTimeString('ru-RU'),
                    employee_cert_info: `ИИН ${emp.iin || '__________'}, сертификат RSA (eGov QR)`,
                    qr_code_base64: qrCodeBase64
                });

                const sheetBuffer = await pdfService.generatePdfFromHtml(sigSheetHtml);
                const sheetKey = `documents/${doc.employee_id}/signature_sheet_${doc.id}_${Date.now()}.pdf`;
                await storageService.uploadFile(sheetBuffer, 'application/pdf', sheetKey);
                
                await query(`
                    INSERT INTO documents (employee_id, type, status, scan_url, created_at)
                    VALUES ($1, 'signature_sheet', 'signed', $2, NOW())
                `, [doc.employee_id, sheetKey]);
            }
        } catch (sheetErr) {
            Logger.error('[Docs] Failed to generate signature sheet:', sheetErr);
        }

        res.json(doc);
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
