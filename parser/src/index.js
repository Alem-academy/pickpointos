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

import path from 'path';
import { fileURLToPath } from 'url';

import { runMigrations } from './services/migrator.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run migrations (will log errors but not crash to allow server to start, or we could await)
runMigrations().catch(console.error);

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// Serve static files from the React app
// Assuming parser/src/index.js -> parser/src -> parser -> root -> dist
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

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

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
