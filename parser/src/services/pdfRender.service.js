import axios from 'axios';
import { Logger } from '../lib/logger.js';
import { pdfService } from './pdf.service.js';

/**
 * HTML → PDF: при наличии PDF_RENDER_GATEWAY_URL — облегчённый рендер на VPS (gateway),
 * иначе локальный Puppeteer на Railway.
 */
export async function htmlToPdfBuffer(htmlContent, options = {}) {
    const lite = options.lite !== false;
    const gatewayUrl = process.env.PDF_RENDER_GATEWAY_URL?.replace(/\/$/, '');
    const secret = process.env.PDF_RENDER_GATEWAY_SECRET;

    if (gatewayUrl && secret) {
        try {
            const endpoint = `${gatewayUrl}/api/render/html-to-pdf`;
            const r = await axios.post(
                endpoint,
                { html: htmlContent, lite },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-PickPoint-Render-Secret': secret
                    },
                    timeout: 90000,
                    maxBodyLength: 50 * 1024 * 1024,
                    maxContentLength: 50 * 1024 * 1024
                }
            );
            if (r.data?.pdfBase64) {
                Logger.info('[pdfRender] gateway %s lite=%s', gatewayUrl, Boolean(r.data.lite));
                return Buffer.from(r.data.pdfBase64, 'base64');
            }
            throw new Error('No pdfBase64 in response');
        } catch (e) {
            Logger.warn('[pdfRender] gateway failed, fallback local Puppeteer:', e.message);
        }
    }

    return pdfService.generatePdfFromHtml(htmlContent, { lite });
}
