
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedFinance() {
    try {
        console.log('Seeding Finance Data...');

        // 1. Get a PVZ
        const pvzRes = await pool.query("SELECT id FROM pvz_points LIMIT 1");
        if (pvzRes.rows.length === 0) {
            console.error('No PVZ found. Please seed PVZ points first.');
            return;
        }
        const pvzId = pvzRes.rows[0].id;
        console.log('Using PVZ ID:', pvzId);

        // 2. Clear existing (optional, maybe safe to keep generic)
        // await pool.query("DELETE FROM rent_contracts WHERE pvz_id = $1", [pvzId]);

        // 3. Seed Rent Contract
        // Check if exists
        const rentCheck = await pool.query("SELECT id FROM rent_contracts WHERE pvz_id = $1", [pvzId]);
        if (rentCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO rent_contracts (id, pvz_id, monthly_rate, payment_day, landlord_name)
                VALUES (gen_random_uuid(), $1, 150000, 5, 'ИП Арендодатель')
            `, [pvzId]);
            console.log('Seeded Rent Contract.');
        } else {
            console.log('Rent Contract already exists.');
        }

        // 4. Seed Financial Transactions (Revenue & Opex) for current month
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Check for transactions
        const transCheck = await pool.query("SELECT id FROM financial_transactions WHERE pvz_id = $1 AND transaction_date >= $2", [pvzId, startOfMonth]);

        if (transCheck.rows.length < 5) {
            // Add Revenue
            await pool.query(`
                INSERT INTO financial_transactions (pvz_id, type, amount, description, transaction_date, source)
                VALUES 
                ($1, 'revenue', 50000, 'Выручка за 1 число', $2, 'manual'),
                ($1, 'revenue', 45000, 'Выручка за 2 число', $3, 'manual'),
                ($1, 'revenue', 60000, 'Выручка за 3 число', $4, 'manual')
             `, [pvzId, new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth(), 2), new Date(today.getFullYear(), today.getMonth(), 3)]);

            // Add OpEx
            await pool.query(`
                INSERT INTO financial_transactions (pvz_id, type, amount, description, transaction_date, source)
                VALUES 
                ($1, 'expense', -5000, 'Канцтовары', $2, 'expense_request'),
                ($1, 'expense', -15000, 'Интернет', $3, 'expense_request')
             `, [pvzId, new Date(today.getFullYear(), today.getMonth(), 5), new Date(today.getFullYear(), today.getMonth(), 10)]);

            console.log('Seeded Financial Transactions.');
        } else {
            console.log('Financial Transactions already exist.');
        }

        // 5. Seed Fact Payroll
        // Need an employee
        const empRes = await pool.query("SELECT id, base_rate FROM employees WHERE role != 'admin' LIMIT 1");
        if (empRes.rows.length > 0) {
            const emp = empRes.rows[0];
            const payrollCheck = await pool.query("SELECT id FROM fact_payroll WHERE employee_id = $1 AND month = $2", [emp.id, startOfMonth]);

            if (payrollCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO fact_payroll (pvz_id, employee_id, month, total_hours, rate, total_amount, status)
                    VALUES ($1, $2, $3, 160, $4, $5, 'calculated')
                `, [pvzId, emp.id, startOfMonth, emp.base_rate || 1000, 160 * (emp.base_rate || 1000)]);
                console.log('Seeded Fact Payroll.');
            } else {
                console.log('Fact Payroll already exists.');
            }
        }

        console.log('Finance seeding completed successfully.');

    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await pool.end();
    }
}

seedFinance();
