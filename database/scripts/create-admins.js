import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createUsers() {
    try {
        console.log('Connecting to database...');

        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const users = [
            { email: 'madina.kimadi.1994@gmail.com', role: 'hr', name: 'Madina Kimadi', iin: '940101000000' },
            { email: 'rauan3173@gmail.com', role: 'admin', name: 'Rauan', iin: '000000000001' },
            { email: 'zhasminkar@gmail.com', role: 'admin', name: 'Zhasminkar', iin: '000000000002' }
        ];

        for (const user of users) {
            const checkRes = await pool.query("SELECT id FROM employees WHERE email = $1", [user.email]);
            if (checkRes.rows.length > 0) {
                console.log(`User ${user.email} already exists. Updating role...`);
                await pool.query("UPDATE employees SET role = $1, password_hash = $2 WHERE email = $3", [user.role, hashedPassword, user.email]);
            } else {
                console.log(`Creating new ${user.role} user: ${user.email}...`);
                await pool.query(`
                    INSERT INTO employees (
                        id, full_name, email, role, status, phone, password_hash, base_rate, created_at, updated_at, iin
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, 'active', '+7 (000) 000-00-00', $4, 0, NOW(), NOW(), $5
                    )
                `, [user.name, user.email, user.role, hashedPassword, user.iin]);
            }
        }
        console.log('Users configured successfully.');
    } catch (err) {
        console.error('Error creating users:', err);
    } finally {
        await pool.end();
    }
}

createUsers();
