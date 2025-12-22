import pg from 'pg';

const remoteConfig = {
    connectionString: 'postgresql://postgres:pKiZMgnZbFXFiEtpLNQroHJgxQdyLzmn@ballast.proxy.rlwy.net:37940/railway',
    ssl: { rejectUnauthorized: false }
};

async function fixSchema() {
    const client = new pg.Client(remoteConfig);
    try {
        await client.connect();
        console.log('Connected to Railway DB...');

        console.log('Adding address column to employees...');
        await client.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS address TEXT;
        `);

        console.log('Adding base_rate column to employees...');
        await client.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS base_rate DECIMAL(10, 2);
        `);

        console.log('Adding probation_until column to employees...');
        await client.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS probation_until DATE;
        `);

        console.log('Schema update complete! ✅');

    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await client.end();
    }
}

fixSchema();
