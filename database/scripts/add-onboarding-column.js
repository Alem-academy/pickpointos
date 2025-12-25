import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = 'postgresql://postgres:pKiZMgnZbFXFiEtpLNQroHJgxQdyLzmn@ballast.proxy.rlwy.net:37940/railway';

const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to Railway DB...');
        console.log('Adding onboarding_checklist column to employees table...');

        await client.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '{}'::jsonb;
        `);

        console.log('Successfully added onboarding_checklist column.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
