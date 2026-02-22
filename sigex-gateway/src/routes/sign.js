import express from 'express';
import axios from 'axios';

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

export default router;
