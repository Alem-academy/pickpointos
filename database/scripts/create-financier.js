
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createFinancier() {
    try {
        console.log('Connecting to database...');

        // Check if user exists
        try {
            await pool.query("ALTER TYPE employee_role ADD VALUE 'financier'");
            console.log("Added 'financier' to employee_role enum.");
        } catch (e) {
            console.log("Enum value 'financier' likely already exists or error ignored:", e.message);
        }

        const checkRes = await pool.query("SELECT id FROM employees WHERE email = 'finance@pvz.kz'");

        if (checkRes.rows.length > 0) {
            console.log('Financier user already exists. Updating role to ensure it is correct...');
            await pool.query("UPDATE employees SET role = 'financier' WHERE email = 'finance@pvz.kz'");
        } else {
            console.log('Creating new financier user...');
            await pool.query(`
                INSERT INTO employees (
                    id, 
                    full_name, 
                    email, 
                    role, 
                    status, 
                    phone, 
                    password_hash,
                    base_rate,
                    created_at,
                    updated_at,
                    iin
                ) VALUES (
                    gen_random_uuid(),
                    'Бақыт Каржыбаев',
                    'finance@pvz.kz',
                    'financier',
                    'active',
                    '+7 (777) 000-00-99',
                    '$2a$10$X7V.j.12345', -- Dummy hash
                    0,
                    NOW(),
                    NOW(),
                    '990101300999' -- Dummy IIN
                )
            `);
        }

        console.log('Financier user configured successfully: finance@pvz.kz');
    } catch (err) {
        console.error('Error creating financier:', err);
    } finally {
        await pool.end();
    }
}

createFinancier();
