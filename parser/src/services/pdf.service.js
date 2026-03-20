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
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process'
                ]
            });

            const page = await browser.newPage();
            
            // Set the HTML content
            await page.setContent(htmlContent, {
                waitUntil: ['networkidle0', 'load', 'domcontentloaded']
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
            
            return Buffer.from(pdfBuffer);
        } catch (error) {
            Logger.error('[PDF Service] Error generating PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
                Logger.info('[PDF Service] Browser closed.');
            }
        }
    }
};
