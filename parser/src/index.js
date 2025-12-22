import './config.js';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { parseSheet } from './parser.js';

// Import Routes
import hrRoutes from './routes/hr.js';
import financeRoutes from './routes/finance.js';
import operationsRoutes from './routes/operations.js';
import documentsRoutes from './routes/documents.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.send('OK');
});

// Parser Endpoint
app.post('/parse', async (req, res) => {
    try {
        const sheetId = req.body.sheetId || process.env.GOOGLE_SHEET_ID;
        if (!sheetId) {
            return res.status(400).json({ error: 'Sheet ID is required' });
        }

        console.log(`🚀 Starting parse for sheet: ${sheetId}`);

        const result = await parseSheet(sheetId);

        res.status(200).json({
            message: 'Parsing completed successfully',
            stats: result
        });
    } catch (error) {
        console.error('❌ Error during parsing:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/', hrRoutes);
app.use('/finance', financeRoutes);
app.use('/', operationsRoutes);
app.use('/', documentsRoutes);
app.use('/analytics', analyticsRoutes);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
