import express from 'express';
import axios from 'axios';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
const router = express.Router();
const SIGEX_API_URL = process.env.SIGEX_API_URL || 'https://sigex.kz/api';

/**
 * Register a new document for signing
 */
router.post('/document', async (req, res) => {
    try {
        // Pass the payload directly to SIGEX
        const response = await axios.post(`${SIGEX_API_URL}`, req.body, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error registering document in SIGEX:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to register document' });
    }
});

/**
 * Generate a strict PDF natively using pdf-lib and register it to SIGEX
 * This solves the eGov Mobile "Archive not found" or "Infinite Loading" issue
 * caused by client-side Blobs or malformed payloads without blowing up VPS memory.
 */
router.post('/document/generate-and-register', async (req, res) => {
    try {
        const { documentData, title, description, isContract } = req.body;

        if (!documentData) {
            return res.status(400).json({ error: 'documentData object is required' });
        }

        // 1. Generate PDF natively on the backend via pdf-lib
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
        const { width, height } = page.getSize();

        if (isContract) {
            // For simplicity in native pdf-lib without complex HTML layout: 
            // We render a standard header and loop through key-value data
            page.drawText('EMPLOYMENT CONTRACT / ТРУДОВОЙ ДОГОВОР', { x: 50, y: height - 50, size: 16, font: fontBold });

            let yOffset = height - 100;
            for (const [key, value] of Object.entries(documentData)) {
                page.drawText(`${key}: ${value}`, { x: 50, y: yOffset, size: 12, font });
                yOffset -= 20;
            }
        } else {
            // Standard Auth Document Format
            page.drawText('PickPoint OS - Authorization Document', { x: 50, y: height - 50, size: 18, font: fontBold });
            page.drawText('You are logging into the system.', { x: 50, y: height - 80, size: 12, font });
            page.drawText(`Nonce: ${documentData.nonce}`, { x: 50, y: height - 120, size: 14, font: fontBold, color: rgb(0, 0, 0.5) });
            page.drawText(`Date: ${new Date().toLocaleString()}`, { x: 50, y: height - 140, size: 10, font });
        }

        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);

        // 2. Register Document with SIGEX, forcing archival so eGov Mobile can download it
        const registerPayload = {
            title: title || 'Авторизация в системе',
            description: description || 'Сгенерированный системой документ',
            settings: {
                forceArchive: true, // Crucial for eGov Mobile App compatibility
                tempStorageAfterRegistration: 24, // Keep for 24 hours
            }
        };

        const regResponse = await axios.post(`${SIGEX_API_URL}`, registerPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const documentId = regResponse.data.documentId;
        if (!documentId) throw new Error('Failed to get documentId from SIGEX registration');

        // 3. Upload the generated PDF bytes to the registered SIGEX document
        await axios.post(`${SIGEX_API_URL}/${documentId}/data?dataRetained=true`, pdfBuffer, {
            headers: { 'Content-Type': 'application/pdf' },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        // 4. Return the document ID so the frontend can start the eGov QR process
        res.json({ documentId: documentId, success: true });

    } catch (error) {
        console.error('Error generating and registering PDF:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to generate and register document' });
    }
});

/**
 * Add signature to a document
 */
router.post('/document/:id/sign', async (req, res) => {
    try {
        const response = await axios.post(`${SIGEX_API_URL}/${req.params.id}`, req.body, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error adding signature in SIGEX:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to add signature' });
    }
});

/**
 * Get document details (signatures etc)
 */
router.get('/document/:id', async (req, res) => {
    try {
        const lastSignId = req.query.lastSignId || 0;
        const response = await axios.get(`${SIGEX_API_URL}/${req.params.id}?lastSignId=${lastSignId}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error getting document details from SIGEX:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to get document details' });
    }
});

/**
 * Add document data (to calculate hash)
 */
router.post('/document/:id/data', async (req, res) => {
    try {
        // Stream the data from req directly to SIGEX, we don't buffer it to avoid memory issues
        // Pass '?dataRetained=true' so SIGEX keeps the payload in temporary storage.
        // This is strictly required for eGov Mobile QR flow to be able to download and display the document.
        const queryString = req.url.includes('?') ? '&dataRetained=true' : '?dataRetained=true';
        const response = await axios.post(`${SIGEX_API_URL}/${req.params.id}/data${queryString}`, req, {
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/octet-stream',
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity, // Important for large files
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error adding document data:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to add data' });
    }
});

/**
 * Register eGov QR signing (Standard flow, no document ID)
 */
router.post('/egovQr', async (req, res) => {
    try {
        const response = await axios.post(`${SIGEX_API_URL}/egovQr`, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error starting eGov QR:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to start egov QR' });
    }
});

/**
 * Send data to eGov QR signing operation
 */
router.post('/egovQr/:operationId', async (req, res) => {
    try {
        const response = await axios.post(`${SIGEX_API_URL}/egovQr/${req.params.operationId}`, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error sending data to eGov QR:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to send data' });
    }
});

/**
 * Check eGov Operation status and get signatures
 */
router.get('/egovQr/:operationId', async (req, res) => {
    try {
        const response = await axios.get(`${SIGEX_API_URL}/egovQr/${req.params.operationId}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error checking operation status:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to check status' });
    }
});

export default router;
