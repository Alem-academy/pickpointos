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
import { getTemplate, getSchema, listAllTemplates, getProcessDefinition, listProcesses } from '../services/templateRegistry.js';

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
    addendum: 'addendum.pdf',
    '01_zayavlenie-o-vyhode-s-dekreta': 'maternity_return.pdf',
    '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom': 'childcare_leave.pdf',
    '03_zayavlenie-ob-izmenenii-personalnyh-dannyh': 'personal_data_change.pdf',
    '04_prikaz-ob-otpuske-po-beremennosti-i-rodam': 'maternity_leave_order.pdf',
    '05_prikaz-o-prodlenii-otpuska-po-beremennosti': 'maternity_extension_order.pdf',
    '06_prikaz-o-vnesenii-izmeneniy-v-fio': 'name_change_order.pdf',
    '07_prikaz-o-vyhode-iz-otpuska-po-uhodu': 'childcare_return_order.pdf',
    '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu': 'unpaid_childcare_order.pdf',
    '09_zayavlenie-na-otpusk-po-beremennosti': 'maternity_leave_app.pdf',
    '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti': 'maternity_extension_app.pdf',
    '11_soglashenie-o-rastorzhenii-trudovogo-dogovora': 'termination_agreement.pdf',
    '12_dop-soglashenie-ob-izmenenii-familii': 'surname_addendum.pdf',
    '13_zayavlenie-o-prieme-na-rabotu': 'job_application.pdf',
    '14_prikaz-o-prieme-na-rabotu': 'hiring_order_new.pdf',
    '15_trudovoy-dogovor': 'employment_contract_new.pdf',
};

const DOC_SIGN_FILE_NAME_RU = {
    contract: 'Трудовой_договор',
    order_hiring: 'Приказ_о_приеме',
    application: 'Заявление_на_прием',
    vacation_application: 'Заявление_на_отпуск',
    vacation_order: 'Приказ_на_отпуск',
    termination_order: 'Приказ_об_увольнении',
    employment_certificate: 'Справка_с_места_работы',
    addendum: 'Доп_соглашение',
    '01_zayavlenie-o-vyhode-s-dekreta': 'Заявление_о_выходе_с_декрета',
    '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom': 'Заявление_на_отпуск_по_уходу',
    '03_zayavlenie-ob-izmenenii-personalnyh-dannyh': 'Заявление_об_изменении_данных',
    '04_prikaz-ob-otpuske-po-beremennosti-i-rodam': 'Приказ_об_отпуске_по_беременности',
    '05_prikaz-o-prodlenii-otpuska-po-beremennosti': 'Приказ_о_продлении_отпуска',
    '06_prikaz-o-vnesenii-izmeneniy-v-fio': 'Приказ_об_изменении_ФИО',
    '07_prikaz-o-vyhode-iz-otpuska-po-uhodu': 'Приказ_о_выходе_из_отпуска',
    '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu': 'Приказ_об_отпуске_без_ЗП',
    '09_zayavlenie-na-otpusk-po-beremennosti': 'Заявление_на_отпуск_по_беременности',
    '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti': 'Заявление_на_продление_отпуска',
    '11_soglashenie-o-rastorzhenii-trudovogo-dogovora': 'Соглашение_о_расторжении',
    '12_dop-soglashenie-ob-izmenenii-familii': 'Доп_соглашение_об_изменении_фамилии',
    '13_zayavlenie-o-prieme-na-rabotu': 'Заявление_на_прием',
    '14_prikaz-o-prieme-na-rabotu': 'Приказ_о_приеме',
    '15_trudovoy-dogovor': 'Трудовой_договор',
};

function buildSignFileName(docType, employeeFullName) {
    const safeName = (employeeFullName || 'Sotrudnik')
        .replace(/\s+/g, '_')
        .replace(/[^\w\-_А-Яа-яЁё]/g, '');
    const docLabel = DOC_SIGN_FILE_NAME_RU[docType] || DOC_SIGN_FILE_NAME_ASCII[docType]?.replace('.pdf', '') || 'Dokument';
    return `${safeName}_${docLabel}.pdf`;
}

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

// GET /templates/schemas - List all available document templates with schemas
router.get('/templates/schemas', async (req, res) => {
    try {
        const templates = listAllTemplates();
        res.json({ templates });
    } catch (err) {
        Logger.error('Error fetching templates:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /templates/schemas/:type - Get schema for a specific template
router.get('/templates/schemas/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const schema = getSchema(type);
        const template = getTemplate(type);
        if (!schema || !template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json({ schema, hasTemplate: !!template });
    } catch (err) {
        Logger.error('Error fetching template schema:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Build template data by mapping employee/employer fields to template variables.
 * Auto-fills known variables; leaves unknown ones for manual input.
 */
function buildTemplateData(emp, employer, schema, params = {}) {
    const now = new Date();
    const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const MONTHS_RU_NOM = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
    const MONTHS_KZ = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
    const MONTHS_KZ_DAT = ['қаңтарда','ақпанда','наурызда','сәуірде','мамырда','маусымда','шілдеде','тамызда','қыркүйекте','қазанда','қарашада','желтоқсанда'];

    // Helper: simple FIO case declension (basic Russian rules)
    // For production accuracy, integrate petrovich or store pre-declined forms in DB
    function declineFirstName(name, case_, isFemale) {
        if (!name || case_ === 'nom') return name;
        const n = name.toLowerCase();
        // Female names
        if (isFemale) {
            if (n.endsWith('а')) return name.slice(0, -1) + (case_ === 'vin' ? 'у' : 'ы');
            if (n.endsWith('я')) return name.slice(0, -1) + 'и';
            return name;
        }
        // Male names
        if (n.endsWith('й')) return name.slice(0, -1) + 'я';
        if (n.endsWith('ь')) return name.slice(0, -1) + 'я';
        if (/[аеёиоуыэюя]/.test(name.slice(-1))) return name; // ends with vowel
        return name + 'а'; // consonant: Миржан → Миржана
    }

    function declinePatronymic(pat, case_, isFemale) {
        if (!pat || case_ === 'nom') return pat;
        if (isFemale) {
            if (pat.toLowerCase().endsWith('на')) return pat.slice(0, -2) + 'ны';
            return pat;
        }
        if (pat.toLowerCase().endsWith('ич')) return pat + 'а';
        return pat;
    }

    function declineFIO(fullName, case_) {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length < 2) return fullName;
        const [last, first, mid = ''] = parts;
        const l = last.toLowerCase();
        const isFemale = l.endsWith('ская') || l.endsWith('цкая') || l.endsWith('ова') || l.endsWith('ева') || l.endsWith('ина') || (last.endsWith('а') && !l.endsWith('ов'));

        // Decline last name
        let declinedLast = last;
        if (l.endsWith('ская') || l.endsWith('цкая')) {
            const base = last.slice(0, -2);
            if (case_ === 'rod' || case_ === 'dat') declinedLast = `${base}ой`;
            if (case_ === 'vin') declinedLast = `${base}ую`;
        } else if (l.endsWith('ова') || l.endsWith('ева') || l.endsWith('ина')) {
            const base = last.slice(0, -1);
            if (case_ === 'rod' || case_ === 'dat') declinedLast = `${base}ой`;
            if (case_ === 'vin') declinedLast = `${base}у`;
        } else if (last.endsWith('а') && !l.endsWith('ов')) {
            if (case_ === 'rod' || case_ === 'dat') declinedLast = `${last.slice(0,-1)}ой`;
            if (case_ === 'vin') declinedLast = `${last.slice(0,-1)}у`;
        } else if (last.endsWith('ев') || last.endsWith('ов')) {
            const base = last.slice(0, -2);
            if (case_ === 'rod') declinedLast = `${base}ова`;
            if (case_ === 'dat') declinedLast = `${base}ову`;
            if (case_ === 'vin') declinedLast = `${base}ова`;
        } else {
            if (case_ === 'rod') declinedLast = `${last}а`;
            if (case_ === 'dat') declinedLast = `${last}у`;
            if (case_ === 'vin') declinedLast = `${last}а`;
        }

        const declinedFirst = declineFirstName(first, case_, isFemale);
        const declinedMid = declinePatronymic(mid, case_, isFemale);

        return [declinedLast, declinedFirst, declinedMid].filter(Boolean).join(' ');
    }

    function declineShortFIO(fullName, case_) {
        if (!fullName) return '';
        const [last, rest] = fullName.split(/\s(.+)/);
        if (!last) return fullName;
        const l = last.toLowerCase();
        const suffix = rest ? ` ${rest}` : '';

        if (l.endsWith('ская') || l.endsWith('цкая')) {
            const base = last.slice(0, -2);
            if (case_ === 'rod' || case_ === 'dat') return `${base}ой${suffix}`;
            if (case_ === 'vin') return `${base}ую${suffix}`;
        }
        if (l.endsWith('ова') || l.endsWith('ева') || l.endsWith('ина')) {
            const base = last.slice(0, -1);
            if (case_ === 'rod' || case_ === 'dat') return `${base}ой${suffix}`;
            if (case_ === 'vin') return `${base}у${suffix}`;
        }
        if (last.endsWith('а')) {
            if (case_ === 'rod' || case_ === 'dat') return `${last.slice(0,-1)}ой${suffix}`;
            if (case_ === 'vin') return `${last.slice(0,-1)}у${suffix}`;
        }
        if (last.endsWith('ев') || last.endsWith('ов')) {
            const base = last.slice(0, -2);
            if (case_ === 'rod') return `${base}ова${suffix}`;
            if (case_ === 'dat') return `${base}ову${suffix}`;
            if (case_ === 'vin') return `${base}ова${suffix}`;
        }
        if (case_ === 'rod') return `${last}а${suffix}`;
        if (case_ === 'dat') return `${last}у${suffix}`;
        if (case_ === 'vin') return `${last}а${suffix}`;
        return fullName;
    }

    // Translate Russian address components to Kazakh
    function translateAddressToKazakh(address) {
        if (!address) return '';
        let a = address;
        // Direct replacements (no regex boundaries needed)
        a = a.replace(/^РК[.,]?\b/g, 'ҚР');
        a = a.replace(/\bРК[.,]?\b/g, 'ҚР');
        a = a.replace(/\bРеспублика Казахстан\b/gi, 'Қазақстан Республикасы');
        a = a.replace(/МВД РК/g, 'ҚР ІІМ');
        a = a.replace(/МВД/g, 'ІІМ');
        a = a.replace(/обл\.\s*Акмолинская/gi, 'Ақмола облысы');
        a = a.replace(/обл\.\s*Алматинская/gi, 'Алматы облысы');
        a = a.replace(/обл\.\s*/gi, 'облысы ');
        a = a.replace(/область/gi, 'облысы');
        a = a.replace(/р-н/gi, 'ауданы');
        a = a.replace(/район/gi, 'ауданы');
        a = a.replace(/г\.\s*/gi, 'қаласы ');
        a = a.replace(/город/gi, 'қаласы');
        a = a.replace(/ул\.\s*/gi, 'көшесі ');
        a = a.replace(/улица/gi, 'көшесі');
        a = a.replace(/д\.\s*/gi, 'үй ');
        a = a.replace(/дом/gi, 'үй');
        a = a.replace(/кв\.\s*/gi, 'пәтер ');
        a = a.replace(/квартира/gi, 'пәтер');
        a = a.replace(/уч\.\s*квартал/gi, 'есептік квартал');
        a = a.replace(/учетный квартал/gi, 'есептік квартал');
        a = a.replace(/пос\.\s*/gi, 'ауылы ');
        a = a.replace(/поселок/gi, 'ауылы');
        a = a.replace(/с\.\s*/gi, 'ауылы ');
        a = a.replace(/село/gi, 'ауылы');
        a = a.replace(/пр\.\s*/gi, 'даңғылы ');
        a = a.replace(/проспект/gi, 'даңғылы');
        a = a.replace(/пер\.\s*/gi, 'оралымы ');
        a = a.replace(/переулок/gi, 'оралымы');
        a = a.replace(/мкр\.?\s*/gi, 'микрорайон ');
        a = a.replace(/жк\.?\s*/gi, 'тұрғын үй кешені ');
        a = a.replace(/жилой комплекс/gi, 'тұрғын үй кешені');
        a = a.replace(/б-р\.?\s*/gi, 'бульвары ');
        a = a.replace(/бульвар/gi, 'бульвары');
        a = a.replace(/наб\.?\s*/gi, 'жағалауы ');
        a = a.replace(/набережная/gi, 'жағалауы');
        a = a.replace(/туп\.?\s*/gi, 'түтігі ');
        a = a.replace(/тупик/gi, 'түтігі');
        a = a.replace(/ш\.?\s*/gi, 'тас жолы ');
        a = a.replace(/шоссе/gi, 'тас жолы');
        a = a.replace(/пл\.?\s*/gi, 'алаңы ');
        a = a.replace(/площадь/gi, 'алаңы');
        a = a.replace(/км\.?\s*/gi, 'шақырым ');
        a = a.replace(/километр/gi, 'шақырым');
        a = a.replace(/\bТОО\b/g, 'ЖШС');
        a = a.replace(/\bАО\b/g, 'АҚ');
        a = a.replace(/\bИП\b/g, 'ЖК');
        a = a.replace(/АО\s*«?Народный банк»?/gi, '«Халық банкі» АҚ');
        a = a.replace(/АО\s*«?Halyk Bank»?/gi, '«Halyk Bank» АҚ');
        a = a.replace(/Алмалинский/gi, 'Алмалы');
        a = a.replace(/Ауэзовский/gi, 'Әуезов');
        a = a.replace(/Бостандык/gi, 'Бостандық');
        a = a.replace(/Жетысу/gi, 'Жетісу');
        a = a.replace(/Медеу/gi, 'Медеу');
        a = a.replace(/Наурызбай/gi, 'Наурызбай');
        a = a.replace(/Турксиб/gi, 'Түркісіб');
        return a;
    }

    function declinePosition(position, case_) {
        if (!position) return '';
        if (case_ !== 'rod') return position;
        const p = position.toLowerCase().trim();
        // Exact matches first
        const exact = {
            'менеджер по работе с клиентами': 'менеджера по работе с клиентами',
            'менеджер пвз': 'менеджера ПВЗ',
            'региональный менеджер': 'регионального менеджера',
            'кассир': 'кассира',
            'старший кассир': 'старшего кассира',
            'оператор пвз': 'оператора ПВЗ',
            'старший оператор': 'старшего оператора',
            'администратор': 'администратора',
            'кладовщик': 'кладовщика',
            'водитель': 'водителя',
            'грузчик': 'грузчика',
            'упаковщик': 'упаковщика',
            'уборщик': 'уборщика',
            'охранник': 'охранника',
            'курьер': 'курьера',
            'специалист': 'специалиста',
            'стажер': 'стажера',
            'бухгалтер': 'бухгалтера',
            'главный бухгалтер': 'главного бухгалтера',
            'директор': 'директора',
            'комплектовщик': 'комплектовщика',
            'разнорабочий': 'разнорабочего',
            'сборщик заказов': 'сборщика заказов',
        };
        if (exact[p]) return exact[p];
        // Generic rules for unknown positions
        if (p.endsWith('тель')) return position.slice(0, -2) + 'ля';
        if (p.endsWith('арь') || p.endsWith('ир') || p.endsWith('ор') || p.endsWith('ур')) return position.slice(0, -2) + 'я';
        if (p.endsWith('ант') || p.endsWith('ент')) return position.slice(0, -1) + 'а';
        if (p.endsWith('ист')) return position.slice(0, -1) + 'а';
        if (p.endsWith('ник') || p.endsWith('щик') || p.endsWith('чик')) return position.slice(0, -1) + 'а';
        if (p.endsWith('ер')) return position.slice(0, -2) + 'ра';
        return position;
    }

    const fullName = emp.full_name || '';
    const shortName = fullName.split(' ').map((p, i) => i === 0 ? p : `${p[0]}.`).join(' ');
    const position = emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ';

    const autoData = {
        // Employee fields (base)
        employeeFullName: fullName,
        employeeFullNameRu: fullName,
        employeeFullNameKz: fullName, // Templates that need separate lang versions use same name for now
        employeeFullNameRod: declineFIO(fullName, 'rod'),
        employeeFullNameDat: declineFIO(fullName, 'dat'),
        employeeFullNameVin: declineFIO(fullName, 'vin'),
        employeeFullNameShort: declineShortFIO(shortName, 'rod'), // backward compat for orders
        employeeFullNameShortRod: declineShortFIO(shortName, 'rod'),
        employeeFullNameShortDat: declineShortFIO(shortName, 'dat'),
        employeeFullNameShortVin: declineShortFIO(shortName, 'vin'),
        employeePosition: position,
        employeePositionRu: position,
        employeePositionKz: position, // Same for now — could be translated later
        employeePositionRod: declinePosition(position, 'rod'),
        employeeIIN: emp.iin || '',
        employeeAddress: emp.registered_address || emp.address || '',
        employeeAddressRu: emp.registered_address || emp.address || '',
        employeeAddressKz: translateAddressToKazakh(emp.registered_address || emp.address || ''),
        employeeAddressResidentRu: emp.address || '',
        employeeAddressRegRu: emp.registered_address || emp.address || '',
        employeePhone: emp.phone || '',
        employeeEmail: emp.email || '',
        employeeIBAN: emp.iban || '',
        employeeIdCard: emp.id_card_number || '',
        idCardNumber: emp.id_card_number || '',
        employeeIdCardIssuedBy: emp.id_card_issued_by || '',
        idCardIssuerRu: emp.id_card_issued_by || '',
        idCardIssuerKz: translateAddressToKazakh(emp.id_card_issued_by || ''),
        employeeIdCardIssueDate: emp.id_card_issue_date ? new Date(emp.id_card_issue_date).toLocaleDateString('ru-RU') : '',
        employeeBank: emp.bank || '',
        employeeBankDetails: emp.iban || '',
        employeeIdNumber: emp.id_card_number || '',
        employeeIdDate: emp.id_card_issue_date ? new Date(emp.id_card_issue_date).toLocaleDateString('ru-RU') : '',

        // Gender-based forms
        employeeGender: emp.gender || 'male',
        employeeResidentAdj: emp.gender === 'female' ? 'проживающая' : 'проживающий',
        employeeRegisteredAdj: emp.gender === 'female' ? 'Зарегистрированная' : 'Зарегистрированный',
        employeeCitizen: emp.gender === 'female' ? 'гражданка' : 'гражданин',
        employeeCitizenKz: emp.gender === 'female' ? 'азаматша' : 'азамат',
        employeeAcknowledged: emp.gender === 'female' ? 'ознакомлена' : 'ознакомлен',
        employeeReturned: emp.gender === 'female' ? 'приступившей' : 'приступившим',
        directorActing: employer.director_name && (employer.director_name.toLowerCase().includes('ова') || employer.director_name.toLowerCase().includes('ева') || employer.director_name.toLowerCase().includes('ина') || employer.director_name.toLowerCase().includes('ская')) ? 'действующей' : 'действующего',

        // Employer fields
        employerName: employer.name || '',
        employerShortName: employer.short_name || '',
        employerBIN: employer.bin || '',
        employerIIN: employer.iin || employer.bin || '',
        employerDirector: employer.director_name || '',
        employerDirectorDative: employer.director_name_dative || '',
        employerDirectorKz: employer.director_name || '',
        employerDirectorRu: employer.director_name || '',
        employerAddress: employer.address || '',
        employerAddressRu: employer.address || '',
        employerAddressKz: translateAddressToKazakh(employer.address || ''),
        employerBank: employer.bank || '',
        employerBIK: employer.bik || '',
        employerBIC: employer.bik || '',
        employerIBAN: employer.iban || '',
        employerAccount: employer.iban || '',

        // Director fields (individual variables for templates)
        directorName: employer.director_name || '',
        directorNameShort: employer.director_name || '', // именительный падеж для подписи
        directorNameShortDat: employer.director_name_dative || declineShortFIO(employer.director_name, 'dat'),
        directorNameShortRod: declineShortFIO(employer.director_name, 'rod'),
        directorNameShortVin: declineShortFIO(employer.director_name, 'vin'),
        directorNameShortKz: employer.director_name || '',
        directorNameShortRu: employer.director_name || '',
        directorNameKz: employer.director_name || '',
        directorNameRu: employer.director_name || '',
        directorNameRod: declineFIO(employer.director_name, 'rod'),
        directorNameDat: declineFIO(employer.director_name, 'dat'),
        directorNameVin: declineFIO(employer.director_name, 'vin'),
        directorBasis: 'Устава',
        directorBasisKz: 'Жарғысы',
        directorBasisRu: 'Устава',

        // Current date components
        currentDate: `${now.getDate()} ${MONTHS_RU[now.getMonth()]} ${now.getFullYear()} г.`,
        currentDateDay: String(now.getDate()),
        currentDateMonth: MONTHS_RU[now.getMonth()],
        currentDateMonthRu: MONTHS_RU[now.getMonth()],
        currentDateMonthKz: MONTHS_KZ[now.getMonth()],
        currentDateYear: String(now.getFullYear()),
        currentDateShort: `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`,
        currentDateNumeric: `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`,

        // Generic date
        dateDay: String(now.getDate()),
        dateMonthRu: MONTHS_RU[now.getMonth()],
        dateMonthKz: MONTHS_KZ[now.getMonth()],
        dateYear: String(now.getFullYear()),

        // Start date (hiring) — prefer params.startDate, fallback to emp.hired_at
        ...(params.startDate || emp.hired_at ? (() => {
            const d = new Date(params.startDate || emp.hired_at);
            return {
                startDateDay: String(d.getDate()),
                startDateMonthRu: MONTHS_RU[d.getMonth()],
                startDateMonthKz: MONTHS_KZ[d.getMonth()],
                startDateYear: String(d.getFullYear()),
            };
        })() : {}),

        // Contract date — prefer params.contractDate, then params.startDate, fallback to emp.hired_at
        ...(params.contractDate || params.startDate || emp.hired_at ? (() => {
            const d = new Date(params.contractDate || params.startDate || emp.hired_at);
            return {
                contractDate: `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`,
                contractDateDay: String(d.getDate()),
                contractDateMonthRu: MONTHS_RU[d.getMonth()],
                contractDateMonthKz: MONTHS_KZ[d.getMonth()],
                contractDateYear: String(d.getFullYear()),
            };
        })() : {}),

        // City
        city: 'Алматы',
        cityRu: 'Алматы',
        cityKz: 'Алматы',

        // PVZ / Workplace
        pvzAddress: emp.pvz_address || '',
        pvzName: emp.pvz_name || '',
        workplaceAddressRu: emp.pvz_address || '',
        workplaceAddressKz: translateAddressToKazakh(emp.pvz_address || ''),
    };

    // Merge auto + manual params (manual overrides auto only when non-empty)
    // Include ALL autoData keys so templates can use any auto-computed variable
    // even if it's not explicitly declared in the schema
    const result = { ...autoData };
    for (const key of Object.keys(schema.variables || {})) {
        const paramVal = params[key];
        const autoVal = autoData[key];
        if (paramVal !== undefined && paramVal !== '' && paramVal !== '__________') {
            result[key] = paramVal;
        } else if (autoVal !== undefined && autoVal !== '') {
            result[key] = autoVal;
        } else if (!(key in autoData)) {
            result[key] = '__________';
        }
    }

    return result;
}

/**
 * Generate a single document for an employee.
 * This helper is used by both single-document and bulk-process endpoints.
 */
async function generateDocumentInternal(employeeId, type, userParams = {}, reqUser = null) {
    // Fetch employee data WITH employer requisites
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
        throw new Error('Employee not found');
    }
    const emp = empResult.rows[0];

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
    const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const MONTHS_KZ = ['қаңтарда', 'ақпанда', 'наурызда', 'сәуірде', 'мамырда', 'маусымда', 'шілдеде', 'тамызда', 'қыркүйекте', 'қазанда', 'қарашада', 'желтоқсанда'];
    const now = new Date();
    const contractDay = String(now.getDate()).padStart(2, '0');
    const contractMonth = MONTHS_RU[now.getMonth()];
    const contractMonthKz = MONTHS_KZ[now.getMonth()];
    const contractYear = now.getFullYear();
    const dateRu = `${contractDay} ${contractMonth} ${contractYear}`;

    const cntRes = await query(
        `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type = 'contract'`, [employeeId]
    );
    const seq = parseInt(cntRes.rows[0].count, 10) + 1;
    const yearShort = String(contractYear).slice(-2);
    const contractNum = `ТД-${String(seq).padStart(3, '0')}/${yearShort}`;

    let schema = null;

    if (type === 'contract') {
        const startDateParam = userParams.startDate;
        let effectiveHiredAt = emp.hired_at;
        if (startDateParam) {
            effectiveHiredAt = startDateParam;
            await query('UPDATE employees SET hired_at = $1 WHERE id = $2', [startDateParam, employeeId]);
        }
        let endDateStr;
        if (emp.contract_end_date) {
            endDateStr = new Date(emp.contract_end_date).toLocaleDateString('ru-RU');
        } else if (effectiveHiredAt) {
            const d = new Date(effectiveHiredAt);
            d.setFullYear(d.getFullYear() + 1);
            endDateStr = d.toLocaleDateString('ru-RU');
        } else {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            endDateStr = d.toLocaleDateString('ru-RU');
        }
        let probationText;
        if (emp.probation_months) {
            const m = emp.probation_months;
            const suffix = m === 1 ? '' : m < 5 ? 'а' : 'ев';
            probationText = `${m} месяц${suffix} / ${m} ай`;
        } else if (emp.probation_until && effectiveHiredAt) {
            const months = Math.round((new Date(emp.probation_until) - new Date(effectiveHiredAt)) / (30 * 24 * 60 * 60 * 1000));
            const suffix = months === 1 ? '' : months < 5 ? 'а' : 'ев';
            probationText = `${months} месяц${suffix} / ${months} ай`;
        } else {
            probationText = 'три месяца / үш ай';
        }
        const baseRate = emp.base_rate ? Number(emp.base_rate) : 85000;
        const startDateStr = effectiveHiredAt ? new Date(effectiveHiredAt).toLocaleDateString('ru-RU') : dateRu;

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
            rules_link: 'https://drive.google.com/file/d/1Du_Sw3n9NmrTZB4CQZeiavH0OI3rUOEa/view',
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
        const { vacationDays = 14, vacationStart, vacationEnd } = userParams;
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
        const { vacationDays = 14, vacationStart, vacationEnd } = userParams;
        const vacStart = vacationStart ? new Date(vacationStart) : now;
        const vacEnd = vacationEnd ? new Date(vacationEnd) : new Date(vacStart.getTime() + vacationDays * 24 * 60 * 60 * 1000);

        const orderCntRes = await query(
            `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type::text LIKE '%order%'`, [employeeId]
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
        const { terminationDate, terminationReason = 'по собственному желанию', contractNumber, contractDate } = userParams;
        const termDate = terminationDate ? new Date(terminationDate) : now;

        const orderCntRes = await query(
            `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type::text LIKE '%order%'`, [employeeId]
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
        const { salary = 85000 } = userParams;

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
        const { contractNumber, contractDate, changeTopic } = userParams;

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
        // Universal template generation for document-templates/ files
        const template = getTemplate(type);
        schema = getSchema(type);

        if (!template || !schema) {
            throw new Error('Unsupported document type');
        }

        // Compute sequence numbers for templates that need them
        const enhancedParams = { ...userParams };
        const schemaVars = Object.keys(schema.variables || {});

        // Contract number for hiring-related documents
        if (schemaVars.includes('contractNumber') && !enhancedParams.contractNumber) {
            const contractCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type = 'contract'`, [employeeId]
            );
            const contractSeq = parseInt(contractCntRes.rows[0].count, 10) + 1;
            const yearShort = String(new Date().getFullYear()).slice(-2);
            enhancedParams.contractNumber = `ТД-${String(contractSeq).padStart(3, '0')}/${yearShort}`;
        }

        // Order number for order documents
        if (schemaVars.includes('orderNumber')) {
            const orderCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type::text LIKE '%order%'`, [employeeId]
            );
            const orderSeq = parseInt(orderCntRes.rows[0].count, 10) + 1;
            const yearShort = String(new Date().getFullYear()).slice(-2);
            enhancedParams.orderNumber = enhancedParams.orderNumber || `П-${String(orderSeq).padStart(3, '0')}/${yearShort}`;
        }

        // Contract date
        if (schemaVars.includes('contractDate') && !enhancedParams.contractDate) {
            const contractRes = await query(
                `SELECT created_at FROM documents WHERE employee_id = $1 AND type = 'contract' ORDER BY created_at DESC LIMIT 1`,
                [employeeId]
            );
            if (contractRes.rows.length > 0) {
                enhancedParams.contractDate = new Date(contractRes.rows[0].created_at).toLocaleDateString('ru-RU');
            } else if (emp.hired_at) {
                enhancedParams.contractDate = new Date(emp.hired_at).toLocaleDateString('ru-RU');
            }
        }

        // Salary amount
        if (schemaVars.includes('salaryAmount') && !enhancedParams.salaryAmount) {
            enhancedParams.salaryAmount = emp.base_rate ? `${Number(emp.base_rate).toLocaleString('ru-RU')} тенге` : '85 000 тенге';
        }

        // Work schedule
        if (schemaVars.includes('workSchedule') && !enhancedParams.workSchedule) {
            enhancedParams.workSchedule = 'сменный график работы / ауысымдық жұмыс кестесі';
        }

        // Probation period
        if (schemaVars.includes('probationPeriod') && !enhancedParams.probationPeriod) {
            if (emp.probation_months) {
                const m = emp.probation_months;
                const suffix = m === 1 ? '' : m < 5 ? 'а' : 'ев';
                enhancedParams.probationPeriod = `${m} месяц${suffix}`;
            } else if (emp.probation_until && emp.hired_at) {
                const months = Math.round((new Date(emp.probation_until) - new Date(emp.hired_at)) / (30 * 24 * 60 * 60 * 1000));
                const suffix = months === 1 ? '' : months < 5 ? 'а' : 'ев';
                enhancedParams.probationPeriod = `${months} месяц${suffix}`;
            } else {
                enhancedParams.probationPeriod = '3 (три) месяца';
            }
        }

        // ID card issue date (formatted)
        if (schemaVars.includes('idCardIssueDate') && !enhancedParams.idCardIssueDate && emp.id_card_issue_date) {
            enhancedParams.idCardIssueDate = new Date(emp.id_card_issue_date).toLocaleDateString('ru-RU');
        }

        // Format termination-related dates for template 11 and similar
        const MONTHS_RU_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        function formatRuDateLong(isoDate) {
            if (!isoDate) return '';
            const d = new Date(isoDate);
            if (isNaN(d.getTime())) return isoDate;
            return `${d.getDate()} ${MONTHS_RU_FULL[d.getMonth()]} ${d.getFullYear()} года`;
        }
        function formatRuDateShort(isoDate) {
            if (!isoDate) return '';
            const d = new Date(isoDate);
            if (isNaN(d.getTime())) return isoDate;
            return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
        }

        if (schemaVars.includes('terminationDate') && enhancedParams.terminationDate) {
            const formatted = formatRuDateLong(enhancedParams.terminationDate);
            if (formatted) enhancedParams.terminationDate = formatted;
        }
        if (schemaVars.includes('agreementDate')) {
            if (enhancedParams.agreementDate) {
                const formatted = formatRuDateShort(enhancedParams.agreementDate);
                if (formatted) enhancedParams.agreementDate = formatted;
            } else if (enhancedParams.terminationDate) {
                // Default agreementDate to terminationDate (short format)
                const termIso = userParams.terminationDate;
                if (termIso) enhancedParams.agreementDate = formatRuDateShort(termIso);
            }
        }
        if (schemaVars.includes('lastWorkingDay') && enhancedParams.lastWorkingDay) {
            const formatted = formatRuDateLong(enhancedParams.lastWorkingDay);
            if (formatted) enhancedParams.lastWorkingDay = formatted;
        }

        // Generic date component computation for templates with date parts
        const MONTHS_KZ_NOM = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
        function computeDateComponents(isoDate, prefix) {
            if (!isoDate) return {};
            const d = new Date(isoDate);
            if (isNaN(d.getTime())) return {};
            const comps = {};
            if (schemaVars.includes(`${prefix}Day`)) comps[`${prefix}Day`] = String(d.getDate());
            if (schemaVars.includes(`${prefix}MonthRu`)) comps[`${prefix}MonthRu`] = MONTHS_RU_FULL[d.getMonth()];
            if (schemaVars.includes(`${prefix}MonthKz`)) comps[`${prefix}MonthKz`] = MONTHS_KZ_NOM[d.getMonth()];
            if (schemaVars.includes(`${prefix}Year`)) comps[`${prefix}Year`] = String(d.getFullYear());
            return comps;
        }

        // Auto-fill date components for common prefixes
        const datePrefixes = [
            { field: 'returnDate', prefix: 'returnDate' },
            { field: 'vacationStart', prefix: 'vacationStart' },
            { field: 'vacationEnd', prefix: 'vacationEnd' },
            { field: 'sickLeaveDate', prefix: 'sickLeave' },
            { field: 'applicationDate', prefix: 'applicationDate' },
            { field: 'startDate', prefix: 'startDate' },
        ];
        for (const { field, prefix } of datePrefixes) {
            if (enhancedParams[field]) {
                const comps = computeDateComponents(enhancedParams[field], prefix);
                Object.assign(enhancedParams, comps);
            }
        }

        // Current date components (for templates that need them)
        if (schemaVars.some(v => v.startsWith('currentDate')) || schemaVars.some(v => v === 'dateDay')) {
            const now = new Date();
            if (schemaVars.includes('currentDateDay')) enhancedParams.currentDateDay = String(now.getDate());
            if (schemaVars.includes('currentDateMonthRu')) enhancedParams.currentDateMonthRu = MONTHS_RU_FULL[now.getMonth()];
            if (schemaVars.includes('currentDateMonthKz')) enhancedParams.currentDateMonthKz = MONTHS_KZ_NOM[now.getMonth()];
            if (schemaVars.includes('currentDateYear')) enhancedParams.currentDateYear = String(now.getFullYear());
            if (schemaVars.includes('dateDay')) enhancedParams.dateDay = String(now.getDate());
            if (schemaVars.includes('dateMonthRu')) enhancedParams.dateMonthRu = MONTHS_RU_FULL[now.getMonth()];
            if (schemaVars.includes('dateMonthKz')) enhancedParams.dateMonthKz = MONTHS_KZ_NOM[now.getMonth()];
            if (schemaVars.includes('dateYear')) enhancedParams.dateYear = String(now.getFullYear());
        }

        // Format returnDate if needed as full string
        if (schemaVars.includes('returnDate') && enhancedParams.returnDate) {
            const formatted = formatRuDateLong(enhancedParams.returnDate);
            if (formatted) enhancedParams.returnDate = formatted;
        }
        // Format applicationDate if needed as short string
        if (schemaVars.includes('applicationDate') && enhancedParams.applicationDate) {
            const formatted = formatRuDateShort(enhancedParams.applicationDate);
            if (formatted) enhancedParams.applicationDate = formatted;
        }
        // Format vacation dates
        if (schemaVars.includes('vacationStartDate') && enhancedParams.vacationStart) {
            const formatted = formatRuDateLong(enhancedParams.vacationStart);
            if (formatted) enhancedParams.vacationStartDate = formatted;
        }
        if (schemaVars.includes('vacationEndDate') && enhancedParams.vacationEnd) {
            const formatted = formatRuDateLong(enhancedParams.vacationEnd);
            if (formatted) enhancedParams.vacationEndDate = formatted;
        }
        if (schemaVars.includes('sickLeaveDate') && enhancedParams.sickLeaveDate) {
            const formatted = formatRuDateLong(enhancedParams.sickLeaveDate);
            if (formatted) enhancedParams.sickLeaveDate = formatted;
        }

        // Compute vacation days and text
        if (schemaVars.includes('vacationDays') || schemaVars.includes('vacationDaysText')) {
            if (enhancedParams.vacationStart && enhancedParams.vacationEnd) {
                const start = new Date(enhancedParams.vacationStart);
                const end = new Date(enhancedParams.vacationEnd);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const diffMs = end.getTime() - start.getTime();
                    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1;
                    if (schemaVars.includes('vacationDays')) enhancedParams.vacationDays = String(diffDays);
                    if (schemaVars.includes('vacationDaysText')) enhancedParams.vacationDaysText = numberToWordsRu(diffDays);
                }
            } else if (enhancedParams.vacationDays && schemaVars.includes('vacationDaysText')) {
                enhancedParams.vacationDaysText = numberToWordsRu(parseInt(enhancedParams.vacationDays, 10));
            }
        }

        // Default sick leave series
        if (schemaVars.includes('sickLeaveSeries') && !enhancedParams.sickLeaveSeries) {
            enhancedParams.sickLeaveSeries = 'БД';
        }

        // Compute old full name for name change templates
        if (schemaVars.includes('employeeFullNameOld') && !enhancedParams.employeeFullNameOld) {
            if (enhancedParams.oldLastName && emp.full_name) {
                const parts = emp.full_name.trim().split(/\s+/);
                if (parts.length >= 1) {
                    parts[0] = enhancedParams.oldLastName;
                    enhancedParams.employeeFullNameOld = parts.join(' ');
                }
            }
        }

        // Agreement number for addendum/agreement documents
        if (schemaVars.includes('agreementNumber') && !enhancedParams.agreementNumber) {
            const agreeCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type::text LIKE '%soglashenie%'`, [employeeId]
            );
            const agreeSeq = parseInt(agreeCntRes.rows[0].count, 10) + 1;
            const yearShort = String(new Date().getFullYear()).slice(-2);
            enhancedParams.agreementNumber = `ДС-${String(agreeSeq).padStart(3, '0')}/${yearShort}`;
        }

        // Map marriageCertIssuer to marriageCertIssuerRu
        if (schemaVars.includes('marriageCertIssuerRu') && !enhancedParams.marriageCertIssuerRu && enhancedParams.marriageCertIssuer) {
            enhancedParams.marriageCertIssuerRu = enhancedParams.marriageCertIssuer;
        }

        const data = buildTemplateData(emp, employer, schema, enhancedParams);
        Logger.info(`[Docs] Template ${type}: schema vars count=${Object.keys(schema.variables || {}).length}, data keys count=${Object.keys(data).length}`);
        Logger.info(`[Docs] Template ${type} sample data:`, JSON.stringify(Object.fromEntries(Object.entries(data).slice(0, 10))));
        htmlContent = fillTemplate(template, data);
    }

    // Save generated HTML to S3
    const htmlBuffer = Buffer.from(htmlContent, 'utf8');
    const htmlKey = `documents/${employeeId}/${type}_${Date.now()}.html`;

    await storageService.uploadFile(htmlBuffer, 'text/html', htmlKey);
    Logger.info('[Docs] Document saved as HTML:', htmlKey);

    // Save to database
    const typesRequiringEmployerSignature = [
        'contract', 'order_hiring', 'vacation_order', 'termination_order', 'employment_certificate', 'addendum',
        '04_prikaz-ob-otpuske-po-beremennosti-i-rodam',
        '05_prikaz-o-prodlenii-otpuska-po-beremennosti',
        '06_prikaz-o-vnesenii-izmeneniy-v-fio',
        '07_prikaz-o-vyhode-iz-otpuska-po-uhodu',
        '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu',
        '11_soglashenie-o-rastorzhenii-trudovogo-dogovora',
        '12_dop-soglashenie-ob-izmenenii-familii',
        '14_prikaz-o-prieme-na-rabotu',
        '15_trudovoy-dogovor',
    ];
    const requiresEmployerSignature = typesRequiringEmployerSignature.includes(type);

    const dbTypeMap = {
        'contract': 'contract',
        'order_hiring': 'order',
        'vacation_order': 'order',
        'termination_order': 'order',
        'employment_certificate': 'other',
        'addendum': 'other',
    };
    // Use dbTypeMap for legacy built-in types, otherwise store the specific type name
    // schema.type is a logical category (employee_application, employer_order, etc.)
    // and should NOT be used as the DB enum value
    const dbType = dbTypeMap[type] || type || 'other';

    const docResult = await query(`
        INSERT INTO documents (employee_id, type, status, scan_url, requires_employer_signature, created_at)
        VALUES ($1, $2, 'draft', $3, $4, NOW())
        RETURNING *
    `, [employeeId, dbType, htmlKey, requiresEmployerSignature]);

    const doc = docResult.rows[0];

    if (type === 'employment_certificate') {
        await query(`
            UPDATE documents
            SET employer_signed_at = NOW(),
                status = 'signed'::document_status,
                employer_cert_info = $1
            WHERE id = $2
        `, [JSON.stringify({ auto_signed: true, reason: 'employer_generated_certificate' }), doc.id]);
        doc.status = 'signed';
        doc.employer_signed_at = new Date().toISOString();
    }

    // Log activity
    await logDocumentGenerated(employeeId, type, doc.id, reqUser);

    return { document: doc, content: htmlContent };
}

// POST /documents/generate - Generate a new document with employer data
// Employer is automatically selected based on employee's main_pvz_id
router.post('/documents/generate', async (req, res) => {
    try {
        const { employeeId, type, iban } = req.body;

        // If an IBAN is provided, save it to the employee
        if (iban) {
            const normalizedIBAN = String(iban).replace(/\s/g, '').toUpperCase();
            await query('UPDATE employees SET iban = $1 WHERE id = $2', [normalizedIBAN, employeeId]);
        }

        const result = await generateDocumentInternal(employeeId, type, req.body.params || req.body, req.user);
        res.status(201).json(result);
    } catch (err) {
        Logger.error('[Docs] Error generating document:', err);
        if (err.message === 'Employee not found') {
            return res.status(404).json({ error: err.message });
        }
        if (err.message === 'Unsupported document type') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /employees/:id/processes/:processType/generate - Bulk generate documents for a process
router.post('/employees/:id/processes/:processType/generate', async (req, res) => {
    try {
        const { id: employeeId, processType } = req.params;
        const { params = {} } = req.body;

        const processDef = getProcessDefinition(processType);
        if (!processDef) {
            return res.status(400).json({ error: 'Unknown process type', available: listAllTemplates() });
        }

        Logger.info(`[Process] Starting bulk generation for ${processType}, employee ${employeeId}`);

        // Update employee record with process-specific params before generating
        if (params.probationMonths) {
            const months = parseInt(params.probationMonths, 10);
            if (!isNaN(months) && months > 0) {
                const empResult = await query('SELECT hired_at FROM employees WHERE id = $1', [employeeId]);
                const hiredAt = empResult.rows[0]?.hired_at;
                if (hiredAt) {
                    const probUntil = new Date(hiredAt);
                    probUntil.setMonth(probUntil.getMonth() + months);
                    await query('UPDATE employees SET probation_months = $1, probation_until = $2 WHERE id = $3', [months, probUntil.toISOString(), employeeId]);
                }
            }
        }
        if (params.contractEndDate) {
            await query('UPDATE employees SET contract_end_date = $1 WHERE id = $2', [params.contractEndDate, employeeId]);
        }

        const documents = [];
        const errors = [];

        // Pre-compute shared sequence numbers for the entire process
        // This ensures all documents reference the same contract/order numbers
        const sharedParams = { ...params };
        const yearShort = String(new Date().getFullYear()).slice(-2);

        // Check if any doc in the process needs a contract number
        const needsContractNumber = processDef.documentTypes.some(dt => {
            const schema = getSchema(dt);
            return schema && Object.keys(schema.variables || {}).includes('contractNumber');
        });
        if (needsContractNumber && !sharedParams.contractNumber) {
            const contractCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type = 'contract'`, [employeeId]
            );
            const contractSeq = parseInt(contractCntRes.rows[0].count, 10) + 1;
            sharedParams.contractNumber = `ТД-${String(contractSeq).padStart(3, '0')}/${yearShort}`;
        }

        // Check if any doc in the process needs an order number
        const needsOrderNumber = processDef.documentTypes.some(dt => {
            const schema = getSchema(dt);
            return schema && Object.keys(schema.variables || {}).includes('orderNumber');
        });
        if (needsOrderNumber && !sharedParams.orderNumber) {
            const orderCntRes = await query(
                `SELECT COUNT(*) FROM documents WHERE employee_id = $1 AND type::text LIKE '%order%'`, [employeeId]
            );
            const orderSeq = parseInt(orderCntRes.rows[0].count, 10) + 1;
            sharedParams.orderNumber = `П-${String(orderSeq).padStart(3, '0')}/${yearShort}`;
        }

        for (const docType of processDef.documentTypes) {
            try {
                const result = await generateDocumentInternal(employeeId, docType, sharedParams, req.user);
                documents.push({
                    type: docType,
                    document: result.document,
                    content: result.content,
                    success: true,
                });
                Logger.info(`[Process] Generated ${docType} for ${processType}`);
            } catch (docErr) {
                Logger.error(`[Process] Failed to generate ${docType}:`, docErr.message);
                errors.push({ type: docType, error: docErr.message });
            }
        }

        // If all failed, return error
        if (documents.length === 0 && errors.length > 0) {
            return res.status(500).json({
                error: 'All documents failed to generate',
                errors,
            });
        }

        res.status(201).json({
            process: processType,
            employeeId,
            documents,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err) {
        Logger.error('[Process] Bulk generation error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// GET /processes - List available HR processes
router.get('/processes', async (req, res) => {
    try {
        const processes = listProcesses();
        res.json({ processes });
    } catch (err) {
        Logger.error('[Process] Error listing processes:', err);
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
        const result = await query(`
            SELECT d.*, e.full_name as employee_full_name
            FROM documents d
            LEFT JOIN employees e ON d.employee_id = e.id
            WHERE d.id = $1
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        const doc = result.rows[0];
        const fileName = buildSignFileName(doc.type, doc.employee_full_name);
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

        Logger.info(`[Docs] sign-employer called for doc ${id}, signature length: ${signature ? signature.length : 0}, certInfo: ${certInfo ? JSON.stringify(certInfo) : 'none'}`);

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
                    WHEN status = 'signed' THEN 'fully_signed'::document_status
                    WHEN status = 'draft' THEN 'employer_signed'::document_status
                    ELSE status
                END,
                signing_completed_at = NOW(),
                signing_method = COALESCE(signing_method, 'ncalayer')
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

        Logger.info(`[Docs] Document sign request received: id=${id}, sigex_doc=${sigex_document_id}, sigex_op=${sigex_operation_id}, hasSignature=${!!signature}, sigLength=${signature?.length || 0}`);

        // Get document info for activity logging
        const docInfo = await query('SELECT employee_id, type, status FROM documents WHERE id = $1', [id]);
        
        const result = await query(`
            UPDATE documents
            SET status = CASE
                    WHEN employer_signed_at IS NOT NULL AND requires_employer_signature = TRUE THEN 'fully_signed'::document_status
                    ELSE 'signed'::document_status
                END,
                signed_at = NOW(),
                signature_cms = $1,
                sigex_document_id = COALESCE($2, sigex_document_id),
                sigex_operation_id = COALESCE($3, sigex_operation_id),
                external_id = $4,
                signing_completed_at = NOW(),
                signing_method = COALESCE(signing_method, 'egov_qr')
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
            Logger.warn(`[Docs] Document sign failed: document ${id} not found`);
            return res.status(404).json({ error: 'Document not found' });
        }

        Logger.info(`[Docs] Document signed successfully: id=${id}, type=${result.rows[0].type}, oldStatus=${docInfo.rows[0]?.status}, newStatus=${result.rows[0].status}`);

        // Update employee status to 'active' if signing contract or hiring order
        const docType = result.rows[0].type;
        const hiringDocTypes = ['contract', 'order_hiring', '13_zayavlenie-o-prieme-na-rabotu', '14_prikaz-o-prieme-na-rabotu', '15_trudovoy-dogovor'];
        if (hiringDocTypes.includes(docType)) {
            await query(`
                UPDATE employees
                SET status = 'active', hired_at = COALESCE(hired_at, NOW())
                WHERE id = (SELECT employee_id FROM documents WHERE id = $1)
                AND status = 'signing'
            `, [id]);
        }

        // Log activity - document signed
        if (docInfo.rows.length > 0) {
            try {
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
            } catch (logErr) {
                Logger.warn('[Docs] Activity log skipped:', logErr.message);
            }
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
            generateSignatureSheet(docId).catch(err => {
                Logger.error(`[Docs] Auto signature sheet generation failed for ${docId}:`, err.message);
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Docs] CRITICAL ERROR in /documents/:id/sign:', err);
        console.error('[Docs] Error message:', err?.message);
        console.error('[Docs] Error stack:', err?.stack);
        console.error('[Docs] Error code:', err?.code);
        console.error('[Docs] Error detail:', err?.detail);
        Logger.error('Error signing document FULL:', err);
        Logger.error('Error signing document msg:', err?.message, 'code:', err?.code, 'detail:', err?.detail);
        const msg = err?.message || '';
        const isBtree =
            msg.includes('btree') ||
            msg.includes('index row size') ||
            err?.code === '54000';
        res.status(500).json({
            error: 'Internal server error',
            details: msg || String(err),
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

        Logger.info(`[Docs] submit-signature called: token=${token?.substring(0,8)}..., sig_len=${signature?.length}, sigex_op=${sigex_operation_id}, sigex_doc=${sigex_document_id}`);

        if (!signature || typeof signature !== 'string') {
            Logger.warn('[Docs] submit-signature rejected: missing signature');
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
            Logger.warn(`[Docs] submit-signature: link not found for token ${token?.substring(0,8)}`);
            return res.status(404).json({ error: 'Signing link not found' });
        }

        const row = linkResult.rows[0];
        Logger.info(`[Docs] submit-signature: docId=${row.document_id}, status=${row.document_status}, type=${row.document_type}, active=${row.is_active}`);

        if (!row.is_active) {
            return res.status(403).json({ error: 'Signing link is deactivated' });
        }
        if (new Date() > new Date(row.expires_at)) {
            return res.status(403).json({ error: 'Signing link has expired' });
        }
        if (row.document_status === 'signed') {
            Logger.info(`[Docs] submit-signature: doc ${row.document_id} already signed`);
            return res.json({ success: true, document: { id: row.document_id, status: 'signed' }, alreadySigned: true });
        }

        const docId = row.document_id;

        const result = await query(`
            UPDATE documents
            SET status = 'signed'::document_status,
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
            Logger.error(`[Docs] submit-signature: UPDATE returned 0 rows for doc ${docId}`);
            return res.status(404).json({ error: 'Document not found' });
        }

        Logger.info(`[Docs] submit-signature: doc ${docId} updated to signed`);

        const docType = result.rows[0].type;
        const hiringDocTypes = ['contract', 'order_hiring', '13_zayavlenie-o-prieme-na-rabotu', '14_prikaz-o-prieme-na-rabotu', '15_trudovoy-dogovor'];
        if (hiringDocTypes.includes(docType)) {
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
            SELECT sl.*, d.type as document_type, d.status as document_status,
                   e.full_name as employee_full_name
            FROM document_signing_links sl
            JOIN documents d ON sl.document_id = d.id
            LEFT JOIN employees e ON d.employee_id = e.id
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
        const fileName = buildSignFileName(doc.type, link.employee_full_name);
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
