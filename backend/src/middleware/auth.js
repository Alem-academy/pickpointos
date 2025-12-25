import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// BYPASS AUTHENTICATION MIDDLEWARE
export const authenticateToken = (req, res, next) => {
    // Hardcode "Super Admin" for every request
    req.user = {
        id: '650e8400-e29b-41d4-a716-446655440000',
        email: 'admin@pvz.kz',
        role: 'admin',
        main_pvz_id: null
    };
    next();
};
