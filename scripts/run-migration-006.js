import fs from 'fs';
import { query } from '../parser/src/lib/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const sql = fs.readFileSync('database/migrations/006_add_employee_legal_fields.sql', 'utf8');
        await query(sql);
        console.log('Migration 006 applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
run();
