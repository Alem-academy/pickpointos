import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, getDbConfig } from '../lib/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
    const client = createClient();

    try {
        console.log('🔌 Connecting to database with config:', getDbConfig());
        await client.connect();
        console.log('✅ Connected successfully!');

        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Running schema.sql...');
        await client.query(schema);
        console.log('✅ Schema created successfully!');

        // Verify tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('\n📊 Created tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n👋 Disconnected from database');
    }
}

setupDatabase();
