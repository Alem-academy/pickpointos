import './config/env.js';
import express from 'express';
// import dotenv from 'dotenv'; // Configured in ./config/env.js already
import cors from 'cors';
import morgan from 'morgan';
import { Logger } from './lib/logger.js';
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
runMigrations().catch(err => Logger.error('Migration failed', err));

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CORS_ORIGIN,
            'http://localhost:5173',
            'http://localhost:8080'
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is allowed or if we are in "wildcard" mode
        if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*' || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            Logger.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Morgan Middleware for HTTP Request Logging
const morganMiddleware = morgan(
    ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            // Configure Morgan to use our custom logger with the http severity
            write: (message) => Logger.http(message.trim()),
        },
    }
);
app.use(morganMiddleware);

// Serve static files from the React app
// Assuming parser/src/index.js -> parser/src -> parser -> root -> dist
const distPath = path.join(__dirname, '../../dist');
Logger.info(`📂 Static files path: ${distPath}`);

// Verify dist exists
import fs from 'fs';
if (!fs.existsSync(distPath)) {
    Logger.error(`❌ CRITICAL: 'dist' folder not found at ${distPath}`);
    Logger.error(`   __dirname: ${__dirname}`);
    Logger.error(`   cwd: ${process.cwd()}`);
} else {
    Logger.info(`✅ 'dist' folder found.`);
}

app.use(express.static(distPath));

// Explicit 404 for missing assets to avoid falling back to index.html
app.use('/assets', (req, res) => {
    Logger.warn(`⚠️ Asset not found: ${req.url}`);
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
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        Logger.error(`❌ Critical: index.html not found at ${indexPath}`);
        res.status(500).send('Application build not found (index.html missing)');
    }
});

app.listen(port, () => {
    Logger.info(`Server listening on port ${port}`);
});
