import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import { Logger } from '../lib/logger.js';

function resolveChromiumPath() {
    const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
    if (fromEnv) {
        return fromEnv;
    }
    const names = ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome'];
    for (const name of names) {
        try {
            const out = execSync(`command -v ${name} 2>/dev/null || true`, {
                encoding: 'utf8',
                shell: '/bin/sh'
            }).trim();
            if (out) {
                Logger.info('[PDF Service] Chromium from PATH: ' + out);
                return out;
            }
        } catch {
            /* ignore */
        }
    }
    return undefined;
}

export const pdfService = {
    /**
     * Converts an HTML string to a PDF Buffer
     * @param {string} htmlContent - Full HTML string to render
     * @param {object} options - Puppeteer PDFOptions
     * @returns {Promise<Buffer>}
     */
    async generatePdfFromHtml(htmlContent, options = {}) {
        const lite = options.lite === true;
        const { lite: _l, ...pdfOverrides } = options;
        let browser;
        try {
            Logger.info('[PDF Service] Launching browser... (lite=%s)', lite);

            const executablePath = resolveChromiumPath();
            if (executablePath) {
                Logger.info('[PDF Service] Using Chromium: ' + executablePath);
            } else {
                Logger.info('[PDF Service] Using Puppeteer bundled Chrome (dev / скачанный cache)');
            }

            browser = await puppeteer.launch({
                executablePath: executablePath || undefined,
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-software-rasterizer'
                ]
            });

            Logger.info('[PDF Service] Browser launched successfully');

            const page = await browser.newPage();
            if (lite) {
                await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
            }

            Logger.info('[PDF Service] Setting HTML content...');
            await page.setContent(htmlContent, {
                waitUntil: lite ? 'domcontentloaded' : ['domcontentloaded', 'networkidle0'],
                timeout: lite ? 25000 : 30000
            });

            const defaultOptions = {
                format: 'A4',
                printBackground: !lite,
                preferCSSPageSize: false,
                scale: lite ? 0.92 : 1,
                margin: lite
                    ? { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' }
                    : { top: '20px', right: '20px', bottom: '20px', left: '20px' },
                ...pdfOverrides
            };

            Logger.info('[PDF Service] Generating PDF buffer...');
            const pdfBuffer = await page.pdf(defaultOptions);
            
            Logger.info('[PDF Service] PDF generated successfully (' + pdfBuffer.length + ' bytes)');
            return Buffer.from(pdfBuffer);
        } catch (error) {
            Logger.error('[PDF Service] Error generating PDF:', error.message);
            Logger.error('[PDF Service] Stack:', error.stack);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
                Logger.info('[PDF Service] Browser closed.');
            }
        }
    }
};
