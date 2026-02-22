import express from 'express';
import axios from 'axios';

const router = express.Router();
const SIGEX_API_URL = process.env.SIGEX_API_URL || 'https://sigex.kz/api';

/**
 * Step 1: Get a nonce from SIGEX for authentication
 */
router.get('/nonce', async (req, res) => {
    try {
        const response = await axios.post(`${SIGEX_API_URL}/auth`, {});
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching nonce from SIGEX:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch nonce' });
    }
});

/**
 * Step 2: Authenticate with signature
 */
router.post('/login', async (req, res) => {
    try {
        const { nonce, signature } = req.body;

        if (!nonce || !signature) {
            return res.status(400).json({ error: 'Nonce and signature are required' });
        }

        // We use external: true because we don't want SIGEX to manage HTTP cookies.
        // We just want to validate the signature and get the user's certificate info.
        const response = await axios.post(`${SIGEX_API_URL}/auth`, {
            nonce,
            signature,
            external: true,
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error authenticating with SIGEX:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Authentication failed' });
    }
});

export default router;
