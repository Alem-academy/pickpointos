import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres:pKiZMgnZbFXFiEtpLNQroHJgxQdyLzmn@ballast.proxy.rlwy.net:37940/railway';

const client = new pg.Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database...');

        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema migration...');
        await client.query(schemaSql);

        console.log('Schema applied successfully! ✅');
    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
