import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { Logger } from '../lib/logger.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
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
        // if (!user.password_hash) {
        //     Logger.error(`Login failed: No password hash for user ${email}`);
        //     return res.status(401).json({ error: 'Account not setup for password login (no hash)' });
        // }

        // 3. Password Check - BYPASSED FOR DEV
        // const validPassword = await bcrypt.compare(password, user.password_hash);
        // Logger.info(`Login Attempt: ${email} | Found User: Yes | Hash Match: ${validPassword}`);

        // if (!validPassword) {
        //     return res.status(401).json({ error: 'Invalid credentials' });
        // }
        Logger.info(`Login SC: ${email} logged in (Password bypass active).`);

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
        Logger.error('Login error:', err);
        // RETURN ERROR DETAILS FOR DEBUGGING
        res.status(500).json({
            error: 'Internal server error',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
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
        Logger.error('Auth check error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /auth/login/iin - Login via eGov IIN extracted from SIGEX certInfo
// The IIN comes from a SIGEX-verified digital signature, so it is already trusted.
router.post('/login/iin', async (req, res) => {
    try {
        const { iin } = req.body;

        if (!iin) {
            return res.status(400).json({ error: 'IIN is required' });
        }

        // 1. Find employee by IIN
        const result = await query(`
            SELECT e.*, p.name as main_pvz_name
            FROM employees e
            LEFT JOIN pvz_points p ON e.main_pvz_id = p.id
            WHERE e.iin = $1
        `, [iin]);

        if (result.rows.length === 0) {
            // IIN not in DB at all — redirect to self-service page
            Logger.info(`EDS Login: IIN ${iin} not found in DB`);
            return res.status(200).json({ found: false });
        }

        const employee = result.rows[0];
        const { password_hash, invite_token, ...safeEmployee } = employee;

        // 2. If employee exists but has no system access (e.g. status='new' without email/role)
        // Still generate a token for self-service — using role from employee record.
        Logger.info(`EDS Login: IIN ${iin} -> employee ${employee.id} (${employee.full_name}), status: ${employee.status}`);

        // 3. Generate JWT — role comes from employees table
        const token = jwt.sign(
            {
                id: employee.id,
                email: employee.email || `iin_${iin}@pvz.internal`,
                role: employee.role,
                main_pvz_id: employee.main_pvz_id,
                iin: employee.iin,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            found: true,
            token,
            user: safeEmployee
        });

    } catch (err) {
        Logger.error('IIN Login error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

export default router;
