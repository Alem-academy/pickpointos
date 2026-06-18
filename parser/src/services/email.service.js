import { Resend } from 'resend';
import { storageService } from './storage.service.js';
import { Logger } from '../lib/logger.js';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'documents@pvz.kz';

let resend = null;
if (resendApiKey) {
    resend = new Resend(resendApiKey);
    Logger.info('[Email] Resend client initialized');
} else {
    Logger.warn('[Email] RESEND_API_KEY not set – email service disabled');
}

export const emailService = {
    /**
     * Check if email service is configured
     */
    isEnabled() {
        return !!resend;
    },

    /**
     * Send a document PDF via email
     * @param {Object} options
     * @param {string} options.to — recipient email
     * @param {string} options.subject — email subject
     * @param {string} options.html — email body HTML
     * @param {string} [options.fileKey] — S3/R2 key or URL of the PDF
     * @param {Buffer} [options.fileBuffer] — PDF buffer (alternative to fileKey)
     * @param {string} options.fileName — attachment file name
     * @returns {Promise<{id: string}>}
     */
    async sendDocument({ to, subject, html, fileKey, fileBuffer, fileName }) {
        if (!resend) {
            throw new Error('Email service is not configured (RESEND_API_KEY missing)');
        }

        if (!to) {
            throw new Error('Missing required field: to');
        }

        if (!fileKey && !fileBuffer) {
            throw new Error('Missing required field: fileKey or fileBuffer');
        }

        // Download PDF from R2 or use provided buffer
        const pdfBuffer = fileBuffer || await storageService.downloadFile(fileKey);
        const base64Content = pdfBuffer.toString('base64');

        const result = await resend.emails.send({
            from: resendFromEmail,
            to,
            subject: subject || 'Документ / Құжат',
            html: html || '<p>Документ во вложении.</p>',
            attachments: [
                {
                    filename: fileName || 'document.pdf',
                    content: base64Content
                }
            ]
        });

        Logger.info(`[Email] Sent document to ${to}, id=${result?.id}`);
        return result;
    }
};
