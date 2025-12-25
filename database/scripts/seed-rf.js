
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedRF() {
    try {
        console.log('Seeding RF Dashboard Data...');

        // 1. Get PVZ (using first one for demo)
        const pvzRes = await pool.query("SELECT id FROM pvz_points LIMIT 1");
        if (pvzRes.rows.length === 0) {
            console.log('No PVZ found.');
            return;
        }
        const pvzId = pvzRes.rows[0].id;
        console.log('Using PVZ:', pvzId);

        // 2. Get Employee
        // Find existing non-admin employee, or create one if needed, to put on shift
        const empRes = await pool.query("SELECT id FROM employees WHERE role != 'admin' LIMIT 1");
        let empId;
        if (empRes.rows.length > 0) {
            empId = empRes.rows[0].id;
        } else {
            console.log('No eligible employee found for shift.');
            return;
        }

        // 3. Insert Shift for TODAY
        const today = new Date().toISOString().split('T')[0];
        const shiftCheck = await pool.query("SELECT id FROM shifts WHERE pvz_id = $1 AND date = $2", [pvzId, today]);

        if (shiftCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO shifts (id, pvz_id, employee_id, date, status, planned_hours)
                VALUES (gen_random_uuid(), $1, $2, $3, 'open', 12)
            `, [pvzId, empId, today]);
            console.log('Seeded Today Shift.');
        } else {
            console.log('Shift for today already exists.');
        }

        // 4. Insert Approved Expense for THIS MONTH
        // We'll insert one if not exists recently
        await pool.query(`
            INSERT INTO expense_requests (pvz_id, requester_id, amount, category, description, status, created_at)
            VALUES ($1, $2, 25000, 'supplies', 'Закуп пакетов и скотча', 'approved', NOW())
        `, [pvzId, empId]);
        console.log('Seeded Approved Expense.');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

seedRF();
