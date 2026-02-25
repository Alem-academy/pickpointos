import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const SIGEX_API_URL = process.env.SIGEX_API_URL || 'https://sigex.kz/api';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(morgan('dev'));

import authRoutes from './routes/auth.js';
import signRoutes from './routes/sign.js';

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'sigex-gateway', timestamp: new Date() });
});

// Use routers
app.use('/api/auth', authRoutes);
app.use('/api/sign', signRoutes);

app.listen(PORT, () => {

    console.log(`SIGEX Gateway running on port ${PORT}`);
});
