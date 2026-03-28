import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

/**
 * Облегчение HTML перед рендером: меньше работы Chromium, меньший PDF для eGov.
 */
function stripHeavyHtml(html) {
    if (typeof html !== 'string') return '';
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<img\b[^>]*>/gi, '')
        .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, '')
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '');
}

function verifyRenderSecret(req, res, next) {
    const expected = process.env.PDF_RENDER_GATEWAY_SECRET;
    if (!expected) {
        console.warn('[render] PDF_RENDER_GATEWAY_SECRET not set — /html-to-pdf disabled');
        return res.status(503).json({ error: 'PDF render endpoint not configured' });
    }
    const got = req.get('X-PickPoint-Render-Secret');
    if (!got || got !== expected) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

/**
 * POST /api/render/html-to-pdf
 * Body: { html: string, lite?: boolean (default true) }
 * Response: { pdfBase64: string, lite: boolean }
 *
 * Рендер на VPS (облегчённый): domcontentloaded, без printBackground, уменьшенные отступы.
 */
router.post('/html-to-pdf', verifyRenderSecret, async (req, res) => {
    const { html, lite = true } = req.body || {};
    if (!html || typeof html !== 'string') {
        return res.status(400).json({ error: 'Field "html" (string) is required' });
    }
    if (html.length > 12 * 1024 * 1024) {
        return res.status(413).json({ error: 'HTML too large (max 12 MB)' });
    }

    const payload = lite ? stripHeavyHtml(html) : html;
    let browser;
    try {
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
        browser = await puppeteer.launch({
            executablePath,
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run'
            ]
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: lite ? 1 : 2 });
        await page.setContent(payload, {
            waitUntil: lite ? 'domcontentloaded' : 'networkidle0',
            timeout: lite ? 25000 : 60000
        });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: !lite,
            scale: lite ? 0.92 : 1,
            preferCSSPageSize: false,
            margin: lite
                ? { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' }
                : { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        await browser.close();
        browser = null;

        res.json({
            pdfBase64: Buffer.from(pdfBuffer).toString('base64'),
            lite: Boolean(lite)
        });
    } catch (err) {
        console.error('[render] html-to-pdf failed:', err.message);
        if (browser) {
            try {
                await browser.close();
            } catch {
                /* ignore */
            }
        }
        res.status(500).json({ error: err.message || 'PDF render failed' });
    }
});

export default router;
