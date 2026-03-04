// Add thumbnail_url column to documents table
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.production' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE documents 
            ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
        `);
        console.log('✅ Added thumbnail_url column to documents table');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
