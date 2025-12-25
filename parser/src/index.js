import './config/env.js';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { parseSheet } from './services/parser.service.js';

// Import Routes
import hrRoutes from './routes/hr.js';
import financeRoutes from './routes/finance.js';
import operationsRoutes from './routes/operations.js';
import documentsRoutes from './routes/documents.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';

// dotenv configured in ./config/env.js

const app = express();
const port = process.env.PORT || 8080;

import path from 'path';
import { fileURLToPath } from 'url';

import { runMigrations } from './services/migrator.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run migrations (will log errors but not crash to allow server to start, or we could await)
runMigrations().catch(console.error);

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CORS_ORIGIN,
            'http://localhost:5173',
            'http://localhost:8080'
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is allowed or if we are in "wildcard" mode (only if credentials not strict, but here we want to be permissive for dev)
        // If CORS_ORIGIN is '*', we must reflect the origin to allow credentials
        // Check if origin is allowed or if we are in "wildcard" mode
        // If CORS_ORIGIN is '*' OR undefined (default permissive), we reflect the origin
        if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*' || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // For debugging: log blocked origin
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// Serve static files from the React app
// Assuming parser/src/index.js -> parser/src -> parser -> root -> dist
const distPath = path.join(__dirname, '../../dist');
console.log(`📂 Static files path: ${distPath}`);

// Verify dist exists
import fs from 'fs';
if (!fs.existsSync(distPath)) {
    console.error(`❌ CRITICAL: 'dist' folder not found at ${distPath}`);
    console.error(`   __dirname: ${__dirname}`);
    console.error(`   cwd: ${process.cwd()}`);
} else {
    console.log(`✅ 'dist' folder found.`);
}

app.use(express.static(distPath));

// Explicit 404 for missing assets to avoid falling back to index.html
app.use('/assets', (req, res) => {
    console.warn(`⚠️ Asset not found: ${req.url}`);
    res.status(404).send('Asset not found');
});

// Health check
app.get('/health', (req, res) => {
    res.send('OK');
});

// Parser Endpoint
// Parser Endpoint (DISABLED TEMPORARILY)
app.post('/parse', async (req, res) => {
    res.status(503).json({
        error: 'Parser service is temporarily disabled.',
        message: 'Please use the application interface to manage data.'
    });
    /*
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
    */
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', hrRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api', operationsRoutes);
app.use('/api', documentsRoutes);
app.use('/api/analytics', analyticsRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error(`❌ Critical: index.html not found at ${indexPath}`);
        res.status(500).send('Application build not found (index.html missing)');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
