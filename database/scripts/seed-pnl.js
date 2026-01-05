
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

async function checkAndSeed() {
    try {
        console.log('Checking financial data...');
        const txRes = await pool.query("SELECT count(*) FROM financial_transactions");
        const payrollRes = await pool.query("SELECT count(*) FROM fact_payroll");

        console.log(`Transactions: ${txRes.rows[0].count}, Payroll: ${payrollRes.rows[0].count}`);

        if (parseInt(txRes.rows[0].count) === 0) {
            console.log('Seeding dummy transactions...');
            // Need a PVZ ID first
            const pvzRes = await pool.query("SELECT id FROM pvz_points LIMIT 1");
            if (pvzRes.rows.length === 0) {
                console.log('No PVZ found. Skipping seed.');
                return;
            }
            const pvzId = pvzRes.rows[0].id;

            // Insert Revenue
            await pool.query(`
                INSERT INTO financial_transactions (pvz_id, type, amount, description, transaction_date)
                VALUES ($1, 'revenue', 1500000, 'Выдача заказов за месяц', NOW())
            `, [pvzId]);

            // Insert Expense
            await pool.query(`
                INSERT INTO financial_transactions (pvz_id, type, amount, description, transaction_date)
                VALUES ($1, 'expense', -50000, 'Аренда терминала', NOW())
            `, [pvzId]);

            console.log('Transactions seeded.');
        }

        if (parseInt(payrollRes.rows[0].count) === 0) {
            console.log('Seeding dummy payroll...');
            const pvzRes = await pool.query("SELECT id FROM pvz_points LIMIT 1");
            if (pvzRes.rows.length > 0) {
                const pvzId = pvzRes.rows[0].id;
                // Need an employee
                const empRes = await pool.query("SELECT id FROM employees LIMIT 1");
                if (empRes.rows.length > 0) {
                    await pool.query(`
                        INSERT INTO fact_payroll (pvz_id, employee_id, month, total_hours, rate, total_amount, status)
                        VALUES ($1, $2, DATE_TRUNC('month', NOW()), 160, 1500, 240000, 'calculated')
                     `, [pvzId, empRes.rows[0].id]);
                    console.log('Payroll seeded.');
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkAndSeed();
