import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../db-client.js';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Fetch user
        const result = await query('SELECT * FROM employees WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // 2. Check Password
        // Note: For existing seeded users without hash, we might need a fallback or they must be re-seeded.
        // Our updated generic seed puts password_hash, so we are good.
        // But for safety, handle null hash
        if (!user.password_hash) {
            return res.status(401).json({ error: 'Account not setup for password login (no hash)' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Generate Token
        // Payload: id, email, role, main_pvz_id
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                main_pvz_id: user.main_pvz_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Return User Info (excluding hash)
        const { password_hash, ...userInfo } = user;

        res.json({
            token,
            user: userInfo
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query('SELECT * FROM employees WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password_hash, ...userInfo } = result.rows[0];
        res.json(userInfo);
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
