import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, getDbConfig } from '../lib/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seedDatabase() {
    const client = createClient();

    try {
        console.log('🔌 Connecting to database with config:', getDbConfig());
        await client.connect();
        console.log('✅ Connected successfully!');

        // Read seed file
        const seedPath = path.join(__dirname, '..', 'seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');

        console.log('🌱 Running seed.sql...');
        await client.query(seed);
        console.log('✅ Seed data inserted successfully!');

        // Verify data
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM pvz_points'),
            client.query('SELECT COUNT(*) FROM employees'),
            client.query('SELECT COUNT(*) FROM financial_transactions')
        ]);

        console.log('\n📊 Database statistics:');
        console.log(`  - PVZ Points: ${counts[0].rows[0].count}`);
        console.log(`  - Employees: ${counts[1].rows[0].count}`);
        console.log(`  - Transactions: ${counts[2].rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n👋 Disconnected from database');
    }
}

seedDatabase();
