import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from root
dotenv.config({ path: join(__dirname, '../../.env') });

const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

const client = new pg.Client(config);

async function addUniqueIndex() {
    try {
        await client.connect();
        console.log('🔌 Connected to database');

        console.log('🧹 Cleaning up potential duplicates...');
        // Keep the first occurrence, delete others
        await client.query(`
            DELETE FROM financial_transactions a USING financial_transactions b
            WHERE a.id < b.id
            AND a.pvz_id = b.pvz_id
            AND a.transaction_date = b.transaction_date
            AND a.type = b.type
            AND a.source = b.source
            AND a.amount = b.amount;
        `);
        console.log('✅ Duplicates removed (if any).');

        console.log('🔒 Creating unique index...');
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_transaction 
            ON financial_transactions (pvz_id, transaction_date, type, source, amount);
        `);
        console.log('✅ Unique index created successfully!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

addUniqueIndex();
