import axios from 'axios';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function run() {
    try {
        // 1. Generate PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        page.drawText('Test Document ' + Date.now(), { x: 50, y: 700, size: 24, color: rgb(0, 0, 0) });
        const pdfBytes = await pdfDoc.saveAsBase64();
        
        // 2. Register Document
        console.log("Registering Doc...");
        const docRes = await axios.post('https://gateway.pvz.kz/api/document/register', {
            title: 'TestAuth.pdf',
            description: 'Test Auth Document',
            settings: { private: false, forceArchive: true }
        });
        const docId = docRes.data.documentId;
        console.log("Doc ID:", docId);

        // 3. Add Data
        console.log("Adding Data...");
        const form = new FormData();
        const blob = new Blob([Buffer.from(pdfBytes, 'base64')], { type: 'application/pdf' });
        // Can't easily use FormData with Axios in Node without extra libs or careful setup.
        // Let's just use the gateway endpoint
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}
// run();
