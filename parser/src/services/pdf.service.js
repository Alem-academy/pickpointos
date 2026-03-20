import puppeteer from 'puppeteer';
import { Logger } from '../lib/logger.js';

export const pdfService = {
    /**
     * Converts an HTML string to a PDF Buffer
     * @param {string} htmlContent - Full HTML string to render
     * @param {object} options - Puppeteer PDFOptions
     * @returns {Promise<Buffer>}
     */
    async generatePdfFromHtml(htmlContent, options = {}) {
        let browser;
        try {
            Logger.info('[PDF Service] Launching browser...');
            
            // Use executable path from env if available (for Railway/Nix)
            const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
            if (executablePath) {
                Logger.info('[PDF Service] Using Chromium from: ' + executablePath);
            }
            
            browser = await puppeteer.launch({
                executablePath: executablePath,
                headless: "new",
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
            
            Logger.info('[PDF Service] Setting HTML content...');
            await page.setContent(htmlContent, {
                waitUntil: ['domcontentloaded', 'networkidle0'],
                timeout: 30000
            });

            // Default PDF format is A4 with standard margins
            const defaultOptions = {
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                },
                ...options
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
