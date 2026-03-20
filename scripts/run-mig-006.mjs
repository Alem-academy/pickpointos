import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const sql = fs.readFileSync('database/migrations/006_add_employee_legal_fields.sql', 'utf8');
        await pool.query(sql);
        console.log('Migration 006 applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
run();
