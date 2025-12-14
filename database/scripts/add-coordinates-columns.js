import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function migrate() {
    try {
        await client.connect();
        console.log('🔌 Connected to database');

        await client.query(`
            ALTER TABLE pvz_points 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
        `);

        console.log('✅ Added latitude and longitude columns to pvz_points');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

migrate();
