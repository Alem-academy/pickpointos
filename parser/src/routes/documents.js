import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { query } from '../lib/db.js';
import QRCode from 'qrcode';
import crypto from 'crypto';
import {
    CONTRACT_TEMPLATE,
    ADDENDUM_TEMPLATE,
    HIRING_ORDER_TEMPLATE,
    EMPLOYMENT_APPLICATION_TEMPLATE,
    VACATION_APPLICATION_TEMPLATE,
    VACATION_ORDER_TEMPLATE,
    TERMINATION_ORDER_TEMPLATE,
    EMPLOYMENT_CERTIFICATE_TEMPLATE,
    fillTemplate,
    numberToWordsRu,
    numberToWordsKz
} from '../services/templates.js';
import { storageService } from '../services/storage.service.js';
import { htmlToPdfBuffer } from '../services/pdfRender.service.js';
import { Logger } from '../lib/logger.js';
import { logDocumentGenerated } from '../lib/activityLogger.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateSignatureSheet, getDocumentVerificationData } from '../services/signatureSheet.service.js';

// Sigex integration is handled via frontend SigexService
// Documents are pre-registered on generation and signed via eGov QR

/**
 * Имя файла для Sigex/eGov Mobile: только ASCII (латиница, цифры, точка).
 * Кириллица в имени на части Android/Google viewer даёт плейсхолдер из подчёркиваний и ошибку «недопустимый PDF».
 */
const DOC_SIGN_FILE_NAME_ASCII = {
    contract: 'employment_contract.pdf',
    order_hiring: 'hiring_order.pdf',
    application: 'job_application.pdf',
    vacation_application: 'vacation_request.pdf',
    vacation_order: 'vacation_order.pdf',
    termination_order: 'termination_order.pdf',
    employment_certificate: 'employment_certificate.pdf',
    addendum: 'addendum.pdf'
};

/**
 * PDF (base64) for eGov Mobile: HTML шаблоны рендерим через Puppeteer; готовый PDF из S3 отдаём как есть.
 */
async function getPdfBase64ForSigningDoc(doc) {
    if (!doc.scan_url) {
        throw new Error('No file for this document');
    }
    const key = doc.scan_url;
    const signedUrl = key.startsWith('http') ? key : await storageService.getFileUrl(key);

    if (key.endsWith('.html')) {
        const response = await axios.get(signedUrl, { responseType: 'text', timeout: 30000 });
        const html = response.data;
        if (!html || typeof html !== 'string') {
            throw new Error('Empty HTML content');
        }
        const pdfBuf = await htmlToPdfBuffer(html, { lite: true });
        return pdfBuf.toString('base64');
    }

    if (key.endsWith('.pdf')) {
        const response = await axios.get(signedUrl, { responseType: 'arraybuffer', timeout: 30000 });
        return Buffer.from(response.data).toString('base64');
    }

    throw new Error('Для подписи в eGov нужен документ в формате HTML или PDF');
}

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
            // Compute contract end date
            let endDateStr;
            if (emp.contract_end_date) {
                endDateStr = new Date(emp.contract_end_date).toLocaleDateString('ru-RU');
            } else if (emp.hired_at) {
                const d = new Date(emp.hired_at);
                d.setFullYear(d.getFullYear() + 1);
                endDateStr = d.toLocaleDateString('ru-RU');
            } else {
                const d = new Date();
                d.setFullYear(d.getFullYear() + 1);
                endDateStr = d.toLocaleDateString('ru-RU');
            }

            // Compute probation text
            let probationText;
            if (emp.probation_months) {
                const m = emp.probation_months;
                const suffix = m === 1 ? '' : m < 5 ? 'а' : 'ев';
                probationText = `${m} месяц${suffix} / ${m} ай`;
            } else if (emp.probation_until && emp.hired_at) {
                const months = Math.round((new Date(emp.probation_until) - new Date(emp.hired_at)) / (30 * 24 * 60 * 60 * 1000));
                const suffix = months === 1 ? '' : months < 5 ? 'а' : 'ев';
                probationText = `${months} месяц${suffix} / ${months} ай`;
            } else {
                probationText = 'три месяца / үш ай';
            }

            const baseRate = emp.base_rate ? Number(emp.base_rate) : 85000;
            const startDateStr = emp.hired_at ? new Date(emp.hired_at).toLocaleDateString('ru-RU') : dateRu;

            htmlContent = fillTemplate(CONTRACT_TEMPLATE, {
                doc_number: contractNum,
                sign_date: dateRu,
                employee_fio: emp.full_name,
                id_num: emp.id_card_number || '__________',
                id_date: emp.id_card_issue_date ? new Date(emp.id_card_issue_date).toLocaleDateString('ru-RU') : '__________',
                id_issuer: emp.id_card_issued_by || '__________',
                iin: emp.iin || '__________',
                position: emp.role === 'rf' ? 'Региональный менеджер / Өңірлік менеджер' : 'Менеджер ПВЗ / ТҚО менеджері',
                work_address: emp.pvz_address || 'не указан',
                start_date: startDateStr,
                end_date: endDateStr,
                probation: probationText,
                vacation_days: '24 календарных дня / 24 күнтізбелік күн',
                salary: baseRate.toLocaleString('ru-RU'),
                salary_words: `${numberToWordsRu(baseRate)} / ${numberToWordsKz(baseRate)}`,
                emp_address: emp.registered_address || emp.address || '__________',
                emp_phone: emp.phone || '__________',
                emp_email: emp.email || '__________',
                rules_link: '#',
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
        } else if (type === 'addendum') {
            // Дополнительное соглашение к трудовому договору
            const { contractNumber, contractDate, changeTopic } = req.body;

            // Generate addendum number
            const addCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type = 'addendum'`, [employeeId]
            );
            const addSeq = parseInt(addCntRes.rows[0].count, 10) + 1;
            const addendumNum = `ДС-${String(addSeq).padStart(3, '0')}/${yearShort}`;

            htmlContent = fillTemplate(ADDENDUM_TEMPLATE, {
                doc_date: `${contractDay} ${contractMonth}`,
                employee_full_name: emp.full_name,
                pvz_address: emp.pvz_address || 'не указан',
            });
        } else {
            return res.status(400).json({ error: 'Unsupported document type' });
        }

        // Save generated HTML to S3
        const htmlBuffer = Buffer.from(htmlContent, 'utf8');
        const htmlKey = `documents/${employeeId}/${type}_${Date.now()}.html`;

        try {
            await storageService.uploadFile(htmlBuffer, 'text/html', htmlKey);
            Logger.info('[Docs] Document saved as HTML:', htmlKey);
        } catch (uploadErr) {
            Logger.error('[Docs] S3 upload failed:', uploadErr.message);
            throw uploadErr;
        }

        // Save to database
        // Documents requiring employer signature per ст. 33 ТК РК
        const typesRequiringEmployerSignature = ['contract', 'order_hiring', 'vacation_order', 'termination_order', 'employment_certificate', 'addendum'];
        const requiresEmployerSignature = typesRequiringEmployerSignature.includes(type);

        const docResult = await query(`
            INSERT INTO documents (employee_id, type, status, scan_url, requires_employer_signature, created_at)
            VALUES ($1, $2, 'draft', $3, $4, NOW())
            RETURNING *
        `, [employeeId, type, htmlKey, requiresEmployerSignature]);

        // Auto-sign employer for one-sided documents (e.g. employment certificate)
        if (type === 'employment_certificate') {
            await query(`
                UPDATE documents
                SET employer_signed_at = NOW(),
                    status = 'signed',
                    employer_cert_info = $1
                WHERE id = $2
            `, [JSON.stringify({ auto_signed: true, reason: 'employer_generated_certificate' }), docResult.rows[0].id]);
            docResult.rows[0].status = 'signed';
            docResult.rows[0].employer_signed_at = new Date().toISOString();
        }

        // Log activity - document generated
        await logDocumentGenerated(employeeId, type, docResult.rows[0].id, req.user);

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

        // For HTML files, fetch content and return it
        if (doc.scan_url.endsWith('.html')) {
            try {
                const response = await axios.get(signedUrl, { responseType: 'text', timeout: 5000 });
                
                res.json({
                    scan_url: signedUrl,
                    content: response.data,
                    type: 'html'
                });
                return;
            } catch (fetchErr) {
                // If fetch fails, log and fall through to return URL only
                Logger.warn('Could not fetch HTML content, returning URL only:', fetchErr.message);
            }
        }
        
        // For PDFs or if HTML fetch failed, return just the URL
        res.json({ 
            scan_url: signedUrl,
            content: null,
            type: doc.scan_url.endsWith('.html') ? 'html' : 'pdf'
        });
    } catch (err) {
        Logger.error('Error fetching document content:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /documents/:id/pdf-base64 — PDF для QR Sigex (только с JWT HR)
router.get('/documents/:id/pdf-base64', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        const doc = result.rows[0];
        const fileName = DOC_SIGN_FILE_NAME_ASCII[doc.type] || 'document.pdf';
        const pdfBase64 = await getPdfBase64ForSigningDoc(doc);
        res.json({
            pdfBase64,
            fileName
        });
    } catch (err) {
        Logger.error('[Docs] pdf-base64 (auth) failed:', err.message);
        const msg = err.message || 'PDF generation failed';
        const code = msg.includes('Для подписи') || msg.includes('No file') ? 400 : 503;
        res.status(code).json({ error: msg });
    }
});

// POST /documents/:id/sign-employer — Подписание работодателем (директор/ИП через NCALayer)
// Требуется JWT аутентификация (HR/директор)
router.post('/documents/:id/sign-employer', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { signature, certInfo } = req.body;

        if (!signature) {
            return res.status(400).json({ error: 'Подпись (signature) обязательна' });
        }

        // Get document info
        const docCheck = await query(
            'SELECT id, type, status, employer_signed_at, requires_employer_signature FROM documents WHERE id = $1',
            [id]
        );

        if (docCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        const doc = docCheck.rows[0];
        if (doc.employer_signed_at) {
            return res.status(409).json({ error: 'Документ уже подписан работодателем' });
        }

        // Mark document as requiring employer signature if not already
        if (!doc.requires_employer_signature) {
            await query('UPDATE documents SET requires_employer_signature = TRUE WHERE id = $1', [id]);
        }

        const result = await query(`
            UPDATE documents
            SET signature_cms_employer = $1,
                employer_signed_at = NOW(),
                employer_cert_info = $2,
                status = CASE
                    WHEN status = 'signed' THEN 'fully_signed'
                    WHEN status = 'draft' THEN 'employer_signed'
                    ELSE status
                END
            WHERE id = $3
            RETURNING *
        `, [signature, certInfo ? JSON.stringify(certInfo) : null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        // Log activity
        const { logActivity } = await import('../lib/activityLogger.js');
        await logActivity({
            employeeId: null, // Will be fetched if needed
            actionType: 'document_signed_employer',
            actionCategory: 'document',
            title: `Документ подписан работодателем`,
            description: doc.type,
            metadata: {
                document_id: id,
                cert_serial: certInfo?.serialNumber || null,
                cert_issuer: certInfo?.issuer || null
            },
            userId: req.user?.id || null
        });

        Logger.info(`[Docs] Employer signed document ${id} (${doc.type})`);

        // Фаза 3: Автогенерация листа подписей если документ теперь fully_signed
        if (result.rows[0].status === 'fully_signed') {
            generateSignatureSheet(id).catch(err => {
                Logger.error(`[Docs] Auto signature sheet generation failed for ${id}:`, err.message);
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('[Docs] Employer sign failed:', err.message);
        res.status(500).json({ error: 'Ошибка подписания работодателем', details: err.message });
    }
});

// GET /documents/pending-employer-signature — Список документов, ожидающих подписи работодателя
router.get('/documents/pending-employer-signature', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT d.id, d.type, d.status, d.created_at, d.requires_employer_signature,
                   d.employer_signed_at, d.signature_cms IS NOT NULL as employee_signed,
                   e.full_name as employee_name, e.iin as employee_iin
            FROM documents d
            LEFT JOIN employees e ON d.employee_id = e.id
            WHERE d.requires_employer_signature = TRUE
              AND d.employer_signed_at IS NULL
            ORDER BY d.created_at DESC
            LIMIT 100
        `);

        res.json(result.rows);
    } catch (err) {
        Logger.error('[Docs] Fetch pending employer docs failed:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /documents/:id/sign - Sign a document (Sigex eGov QR)
router.post('/documents/:id/sign', async (req, res) => {
    try {
        const { id } = req.params;
        const { signature, signType, sigex_document_id, sigex_operation_id } = req.body;

        // Get document info for activity logging
        const docInfo = await query('SELECT employee_id, type FROM documents WHERE id = $1', [id]);
        
        const result = await query(`
            UPDATE documents
            SET status = CASE
                    WHEN employer_signed_at IS NOT NULL AND requires_employer_signature = TRUE THEN 'fully_signed'
                    ELSE 'signed'
                END,
                signed_at = NOW(),
                signature_cms = $1,
                sigex_document_id = COALESCE($2, sigex_document_id),
                sigex_operation_id = COALESCE($3, sigex_operation_id),
                external_id = $4
            WHERE id = $5
            RETURNING *
        `, [
            signature || null,
            sigex_document_id || null,
            sigex_operation_id || null,
            `SIGEX-${Date.now()}`,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Update employee status to 'active' if signing contract or hiring order
        const docType = result.rows[0].type;
        if (['contract', 'order_hiring'].includes(docType)) {
            await query(`
                UPDATE employees
                SET status = 'active', hired_at = COALESCE(hired_at, NOW())
                WHERE id = (SELECT employee_id FROM documents WHERE id = $1)
                AND status = 'signing'
            `, [id]);
        }

        // Log activity - document signed
        if (docInfo.rows.length > 0) {
            const { logActivity } = await import('../lib/activityLogger.js');
            await logActivity({
                employeeId: docInfo.rows[0].employee_id,
                actionType: 'document_signed',
                actionCategory: 'document',
                title: `Документ подписан через Sigex`,
                description: result.rows[0].type,
                metadata: { 
                    document_id: id,
                    sigex_document_id,
                    signType: signType || 'cms'
                }
            });
        }

        try {
            await query(`
                UPDATE document_signing_links
                SET is_active = false, used_at = NOW()
                WHERE document_id = $1 AND is_active = true
            `, [id]);
        } catch (linkErr) {
            Logger.warn('[Docs] deactivate signing link skipped:', linkErr.message);
        }

        // Фаза 3: Автогенерация листа подписей если документ теперь fully_signed
        if (result.rows[0].status === 'fully_signed') {
            generateSignatureSheet(id).catch(err => {
                Logger.error(`[Docs] Auto signature sheet generation failed for ${id}:`, err.message);
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('Error signing document:', err.message, err.code || '', err.detail || '');
        const msg = err.message || '';
        const isBtree =
            msg.includes('btree') ||
            msg.includes('index row size') ||
            err.code === '54000';
        res.status(500).json({
            error: 'Internal server error',
            ...(isBtree
                ? {
                      hint: 'Удалите индекс idx_documents_signature_cms (миграция parser/src/migrations/009_drop_signature_cms_index.sql).'
                  }
                : {})
        });
    }
});

// POST /sign/:token/submit-signature — public completion using signing link (no HR JWT)
router.post('/sign/:token/submit-signature', async (req, res) => {
    try {
        const { token } = req.params;
        const { signature, sigex_operation_id, sigex_document_id } = req.body || {};

        if (!signature || typeof signature !== 'string') {
            return res.status(400).json({ error: 'signature is required' });
        }

        const linkResult = await query(`
            SELECT sl.id as link_id, sl.document_id, sl.is_active, sl.expires_at,
                   d.status as document_status, d.employee_id, d.type as document_type
            FROM document_signing_links sl
            JOIN documents d ON sl.document_id = d.id
            WHERE sl.token = $1
        `, [token]);

        if (linkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Signing link not found' });
        }

        const row = linkResult.rows[0];

        if (!row.is_active) {
            return res.status(403).json({ error: 'Signing link is deactivated' });
        }
        if (new Date() > new Date(row.expires_at)) {
            return res.status(403).json({ error: 'Signing link has expired' });
        }
        if (row.document_status === 'signed') {
            return res.json({ success: true, document: { id: row.document_id, status: 'signed' }, alreadySigned: true });
        }

        const docId = row.document_id;

        const result = await query(`
            UPDATE documents
            SET status = 'signed',
                signed_at = NOW(),
                signature_cms = $1,
                sigex_document_id = COALESCE($2, sigex_document_id),
                sigex_operation_id = COALESCE($3, sigex_operation_id),
                external_id = $4
            WHERE id = $5
            RETURNING *
        `, [
            signature,
            sigex_document_id || null,
            sigex_operation_id || null,
            `SIGEX-${Date.now()}`,
            docId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const docType = result.rows[0].type;
        if (['contract', 'order_hiring'].includes(docType)) {
            await query(`
                UPDATE employees
                SET status = 'active', hired_at = COALESCE(hired_at, NOW())
                WHERE id = (SELECT employee_id FROM documents WHERE id = $1)
                AND status = 'signing'
            `, [docId]);
        }

        const { logActivity } = await import('../lib/activityLogger.js');
        await logActivity({
            employeeId: row.employee_id,
            actionType: 'document_signed',
            actionCategory: 'document',
            title: `Документ подписан через Sigex (публичная ссылка)`,
            description: docType,
            metadata: {
                document_id: docId,
                sigex_document_id,
                signType: 'cms'
            }
        });

        await query(`
            UPDATE document_signing_links
            SET is_active = false, used_at = NOW()
            WHERE id = $1
        `, [row.link_id]);

        res.json({ success: true, document: result.rows[0] });
    } catch (err) {
        Logger.error('[Docs] Public submit-signature failed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /documents/:id - Delete a document
router.delete('/documents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // First check if document exists and get its status
        const checkResult = await query('SELECT * FROM documents WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const doc = checkResult.rows[0];
        
        // Prevent deletion of signed documents
        if (doc.status === 'signed') {
            return res.status(403).json({ 
                error: 'Cannot delete signed document',
                message: 'Подписанные документы нельзя удалить. Они хранятся в архиве.'
            });
        }
        
        // Delete from storage (S3) if scan_url exists
        if (doc.scan_url && !doc.scan_url.startsWith('http')) {
            try {
                await storageService.deleteFile(doc.scan_url);
                Logger.info('[Docs] Deleted file from storage:', doc.scan_url);
            } catch (storageErr) {
                Logger.warn('[Docs] Failed to delete from storage:', storageErr.message);
                // Continue with DB deletion anyway
            }
        }
        
        // Delete from database
        await query('DELETE FROM documents WHERE id = $1', [id]);
        
        Logger.info('[Docs] Document deleted:', id);
        res.json({ success: true, message: 'Document deleted successfully' });
        
    } catch (err) {
        Logger.error('[Docs] Delete failed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /documents/:id/signing-link - Generate remote signing link
router.post('/documents/:id/signing-link', async (req, res) => {
    try {
        const { id } = req.params;
        const { expiresInDays = 7 } = req.body;
        
        Logger.info(`[Docs] Generating signing link for document ${id}`);
        
        // Check if document exists
        const docResult = await query(`
            SELECT d.*, e.iin as employee_iin, e.full_name as employee_name
            FROM documents d
            JOIN employees e ON d.employee_id = e.id
            WHERE d.id = $1
        `, [id]);
        
        if (docResult.rows.length === 0) {
            Logger.warn(`[Docs] Document not found: ${id}`);
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const doc = docResult.rows[0];
        
        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        
        Logger.info(`[Docs] Generated token: ${token.substring(0, 8)}...`);
        
        // Create or update signing link
        const linkResult = await query(`
            INSERT INTO document_signing_links 
            (document_id, employee_id, token, expires_at, created_by_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (document_id) 
            DO UPDATE SET 
                token = EXCLUDED.token,
                expires_at = EXCLUDED.expires_at,
                used_at = NULL,
                is_active = TRUE,
                created_at = NOW()
            RETURNING *
        `, [id, doc.employee_id, token, expiresAt, req.user?.id]);
        
        Logger.info(`[Docs] Signing link saved to database`);
        
        // Generate full URL
        const baseUrl = process.env.FRONTEND_URL || 'https://pickpointos-production.up.railway.app';
        const signingUrl = `${baseUrl}/sign/${token}`;
        
        Logger.info(`[Docs] Signing link generated for document ${id}: ${signingUrl}`);
        
        res.json({
            success: true,
            signingUrl,
            token,
            expiresAt: expiresAt.toISOString(),
            document: {
                id: doc.id,
                type: doc.type,
                employee_name: doc.employee_name,
                employee_iin: doc.employee_iin
            }
        });
        
    } catch (err) {
        Logger.error('[Docs] Generate signing link failed:', err);
        Logger.error('[Docs] Error details:', JSON.stringify({
            message: err.message,
            stack: err.stack,
            code: err.code
        }));
        res.status(500).json({ 
            error: 'Internal server error',
            message: err.message 
        });
    }
});

// GET /sign/:token/pdf-base64 — PDF для eGov по публичной ссылке (без JWT)
router.get('/sign/:token/pdf-base64', async (req, res) => {
    try {
        const { token } = req.params;

        const linkResult = await query(`
            SELECT sl.*, d.type as document_type, d.status as document_status
            FROM document_signing_links sl
            JOIN documents d ON sl.document_id = d.id
            WHERE sl.token = $1
        `, [token]);

        if (linkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Signing link not found' });
        }

        const link = linkResult.rows[0];
        if (!link.is_active) {
            return res.status(403).json({ error: 'Signing link is deactivated' });
        }
        if (new Date() > new Date(link.expires_at)) {
            return res.status(403).json({ error: 'Signing link has expired' });
        }
        if (link.document_status === 'signed') {
            return res.status(400).json({ error: 'Document already signed' });
        }

        const docResult = await query('SELECT * FROM documents WHERE id = $1', [link.document_id]);
        if (docResult.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        const doc = docResult.rows[0];
        const fileName = DOC_SIGN_FILE_NAME_ASCII[doc.type] || 'document.pdf';
        const pdfBase64 = await getPdfBase64ForSigningDoc(doc);

        res.json({
            pdfBase64,
            fileName
        });
    } catch (err) {
        Logger.error('[Docs] pdf-base64 (public link) failed:', err.message);
        const msg = err.message || 'PDF generation failed';
        const code = msg.includes('Для подписи') || msg.includes('No file') ? 400 : 503;
        res.status(code).json({ error: msg });
    }
});

// GET /sign/:token - Get document signing info by token
router.get('/sign/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        // Find signing link
        const linkResult = await query(`
            SELECT sl.*, d.type as document_type, d.status as document_status,
                   d.sigex_document_id as document_sigex_id,
                   e.full_name as employee_name, e.iin as employee_iin
            FROM document_signing_links sl
            JOIN documents d ON sl.document_id = d.id
            JOIN employees e ON d.employee_id = e.id
            WHERE sl.token = $1
        `, [token]);
        
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Signing link not found' });
        }
        
        const link = linkResult.rows[0];
        
        // Check if link is still valid
        if (!link.is_active) {
            return res.status(403).json({ error: 'Signing link is deactivated' });
        }
        
        if (new Date() > new Date(link.expires_at)) {
            return res.status(403).json({ error: 'Signing link has expired' });
        }
        
        // Update access tracking
        await query(`
            UPDATE document_signing_links
            SET last_accessed_at = NOW(), access_count = access_count + 1
            WHERE id = $1
        `, [link.id]);
        
        res.json({
            success: true,
            document: {
                id: link.document_id,
                type: link.document_type,
                status: link.document_status,
                sigex_document_id: link.document_sigex_id || null
            },
            employee: {
                name: link.employee_name,
                iin: link.employee_iin
            },
            expiresAt: link.expires_at
        });
        
    } catch (err) {
        Logger.error('[Docs] Get signing link failed:', err);
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

// ───────────────────────────────────────────────
// ФАЗА 3: ЛИСТ ПОДПИСЕЙ
// ───────────────────────────────────────────────

// POST /documents/:id/generate-signature-sheet — сгенерировать/пересоздать лист подписей
router.post('/documents/:id/generate-signature-sheet', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await generateSignatureSheet(id);
        if (!result) {
            return res.status(400).json({ error: 'Документ должен быть подписан обеими сторонами' });
        }
        res.json({ success: true, ...result });
    } catch (err) {
        Logger.error('[Docs] Generate signature sheet failed:', err.message);
        res.status(500).json({ error: 'Ошибка генерации листа подписей', details: err.message });
    }
});

// GET /documents/:id/signature-sheet — получить URL листа подписей
router.get('/documents/:id/signature-sheet', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT signature_sheet_url, signature_sheet_generated_at, final_pdf_url
            FROM documents WHERE id = $1
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Документ не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('[Docs] Fetch signature sheet failed:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /documents/:id/final-pdf — получить URL финального PDF
router.get('/documents/:id/final-pdf', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT final_pdf_url, final_pdf_generated_at
            FROM documents WHERE id = $1
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Документ не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        Logger.error('[Docs] Fetch final PDF failed:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /documents/:id/verify — публичная верификация документа (без авторизации)
router.get('/documents/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await getDocumentVerificationData(id);
        if (!data) {
            return res.status(404).json({ error: 'Документ не найден' });
        }
        res.json(data);
    } catch (err) {
        Logger.error('[Docs] Verify document failed:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
