import { query } from '../lib/db.js';
import { Logger } from '../lib/logger.js';
import { storageService } from './storage.service.js';
import { pdfService } from './pdf.service.js';
import { htmlToPdfBuffer } from './pdfRender.service.js';
import { SIGNATURE_SHEET_TEMPLATE, fillTemplate } from './templates.js';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || process.env.VITE_API_URL || 'https://pickpoint.kz';

/**
 * Форматирует дату в локализованный формат
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Извлекает читаемую информацию из сертификата (JSONB или объект)
 */
function formatCertInfo(certInfo) {
    if (!certInfo) return 'Информация о сертификате недоступна';
    const info = typeof certInfo === 'string' ? JSON.parse(certInfo) : certInfo;
    const parts = [];
    if (info.subject?.CN || info.commonName) parts.push(`Владелец: ${info.subject?.CN || info.commonName}`);
    if (info.subject?.SERIALNUMBER || info.iin) parts.push(`ИИН/Серийный: ${info.subject?.SERIALNUMBER || info.iin}`);
    if (info.serialNumber) parts.push(`Серийный номер: ${info.serialNumber}`);
    if (info.issuer?.CN || info.issuer?.O) parts.push(`Издатель: ${info.issuer?.CN || info.issuer?.O || 'НУЦ РК'}`);
    if (info.validFrom && info.validTo) {
        parts.push(`Срок действия: ${formatDate(info.validFrom)} – ${formatDate(info.validTo)}`);
    }
    return parts.length ? parts.join(' \n') : JSON.stringify(info, null, 2);
}

/**
 * Генерирует QR-код в base64 PNG
 */
async function generateVerificationQr(documentId) {
    const verifyUrl = `${PUBLIC_APP_URL}/verify/${documentId}`;
    try {
        const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 2 });
        return dataUrl; // data:image/png;base64,...
    } catch (e) {
        Logger.warn('[SignatureSheet] QR generation failed:', e.message);
        return '';
    }
}

/**
 * Генерирует HTML листа подписей
 */
async function buildSignatureSheetHtml(documentData) {
    const {
        id,
        type,
        employer_signed_at,
        employer_cert_info,
        signature_cms_employer,
        employee_signed_at,
        employee_cert_info,
        signature_cms,
        employee_name,
        employee_iin,
        employer_name,
        employer_bin
    } = documentData;

    const qrBase64 = await generateVerificationQr(id);

    const data = {
        document_name: DOCUMENT_TYPE_NAMES[type] || type,
        document_uuid: id,
        employer_name: employer_name || '—',
        employer_bin: employer_bin || '—',
        employer_sign_date: formatDate(employer_signed_at),
        employer_cert_info: formatCertInfo(employer_cert_info),
        employee_name: employee_name || '—',
        employee_iin: employee_iin || '—',
        employee_sign_date: formatDate(employee_signed_at || documentData.signed_at),
        employee_cert_info: formatCertInfo(employee_cert_info),
        qr_code_base64: qrBase64
    };

    return fillTemplate(SIGNATURE_SHEET_TEMPLATE, data);
}

const DOCUMENT_TYPE_NAMES = {
    contract: 'Трудовой договор',
    order_hiring: 'Приказ о приеме на работу',
    application: 'Заявление на прием на работу',
    vacation_application: 'Заявление на отпуск',
    vacation_order: 'Приказ на отпуск',
    termination_order: 'Приказ об увольнении',
    employment_certificate: 'Справка с места работы'
};

/**
 * Скачивает PDF по URL и возвращает Buffer
 */
async function fetchPdfBuffer(url) {
    if (!url) return null;
    try {
        // If it's a signed URL or direct S3 URL, fetch it
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        Logger.warn('[SignatureSheet] Failed to fetch PDF from URL:', url, e.message);
        return null;
    }
}

/**
 * Объединяет два PDF буфера в один
 */
async function mergePdfs(pdfBuffers) {
    const mergedPdf = await PDFDocument.create();
    for (const buffer of pdfBuffers) {
        if (!buffer) continue;
        try {
            const pdf = await PDFDocument.load(buffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        } catch (e) {
            Logger.warn('[SignatureSheet] Failed to merge PDF:', e.message);
        }
    }
    return await mergedPdf.save();
}

/**
 * Генерирует лист подписей и финальный PDF для документа.
 * Вызывается когда обе стороны подписали документ (status = 'fully_signed').
 *
 * @param {string} documentId
 * @returns {Promise<{signatureSheetUrl: string, finalPdfUrl: string}>}
 */
export async function generateSignatureSheet(documentId) {
    Logger.info(`[SignatureSheet] Starting generation for document ${documentId}`);

    // 1. Fetch document with all signing data
    const docResult = await query(`
        SELECT 
            d.id, d.type, d.status, d.scan_url, d.signed_at, d.signature_cms,
            d.employer_signed_at, d.signature_cms_employer, d.employer_cert_info,
            e.full_name as employee_name, e.iin as employee_iin,
            emp.name as employer_name, emp.bin as employer_bin
        FROM documents d
        LEFT JOIN employees e ON d.employee_id = e.id
        LEFT JOIN employers emp ON e.employer_id = emp.id
        WHERE d.id = $1
    `, [documentId]);

    if (docResult.rows.length === 0) {
        throw new Error('Документ не найден');
    }

    const doc = docResult.rows[0];

    if (doc.status !== 'fully_signed') {
        Logger.warn(`[SignatureSheet] Document ${documentId} is not fully signed (status: ${doc.status}). Skipping.`);
        return null;
    }

    // 2. Generate signature sheet HTML → PDF
    const sheetHtml = await buildSignatureSheetHtml(doc);
    const sheetPdfBuffer = await htmlToPdfBuffer(sheetHtml, { lite: true });

    const datePrefix = new Date().toISOString().split('T')[0];
    const sheetKey = `signaturesheets/${datePrefix}/${documentId}_signature_sheet.pdf`;
    await storageService.uploadFile(sheetPdfBuffer, 'application/pdf', sheetKey);
    const sheetUrl = await storageService.getFileUrl(sheetKey, 86400 * 365); // 1 year

    Logger.info(`[SignatureSheet] Sheet uploaded: ${sheetKey}`);

    // 3. Merge original document + signature sheet into final PDF
    let finalPdfUrl = null;
    const originalPdfBuffer = doc.scan_url ? await fetchPdfBuffer(doc.scan_url) : null;

    if (originalPdfBuffer) {
        const mergedBuffer = await mergePdfs([originalPdfBuffer, sheetPdfBuffer]);
        const finalKey = `finaldocuments/${datePrefix}/${documentId}_final.pdf`;
        await storageService.uploadFile(Buffer.from(mergedBuffer), 'application/pdf', finalKey);
        finalPdfUrl = await storageService.getFileUrl(finalKey, 86400 * 365);
        Logger.info(`[SignatureSheet] Final PDF uploaded: ${finalKey}`);
    } else {
        Logger.warn(`[SignatureSheet] No original PDF found for ${documentId}, using sheet as final`);
        finalPdfUrl = sheetUrl;
    }

    // 4. Update document record
    await query(`
        UPDATE documents
        SET signature_sheet_url = $1,
            signature_sheet_generated_at = NOW(),
            final_pdf_url = $2,
            final_pdf_generated_at = NOW()
        WHERE id = $3
    `, [sheetUrl, finalPdfUrl, documentId]);

    Logger.info(`[SignatureSheet] Completed for document ${documentId}`);

    return { signatureSheetUrl: sheetUrl, finalPdfUrl };
}

/**
 * Возвращает данные для публичной страницы верификации документа
 */
export async function getDocumentVerificationData(documentId) {
    const result = await query(`
        SELECT 
            d.id, d.type, d.status, d.created_at, d.signed_at, d.employer_signed_at,
            d.signature_sheet_url, d.final_pdf_url,
            e.full_name as employee_name, e.iin as employee_iin,
            emp.name as employer_name, emp.bin as employer_bin
        FROM documents d
        LEFT JOIN employees e ON d.employee_id = e.id
        LEFT JOIN employers emp ON e.employer_id = emp.id
        WHERE d.id = $1
    `, [documentId]);

    if (result.rows.length === 0) return null;

    const doc = result.rows[0];
    return {
        id: doc.id,
        documentType: DOCUMENT_TYPE_NAMES[doc.type] || doc.type,
        status: doc.status,
        createdAt: doc.created_at,
        employeeSignedAt: doc.signed_at,
        employerSignedAt: doc.employer_signed_at,
        isFullySigned: doc.status === 'fully_signed',
        hasSignatureSheet: !!doc.signature_sheet_url,
        employeeName: doc.employee_name,
        employeeIin: doc.employee_iin,
        employerName: doc.employer_name,
        employerBin: doc.employer_bin,
        signatureSheetUrl: doc.signature_sheet_url,
        finalPdfUrl: doc.final_pdf_url
    };
}
