import pg from 'pg';

const localConfig = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'Gonduras1@',
    port: 5432,
    ssl: false
};

const remoteConfig = {
    connectionString: 'postgresql://postgres:pKiZMgnZbFXFiEtpLNQroHJgxQdyLzmn@ballast.proxy.rlwy.net:37940/railway',
    ssl: { rejectUnauthorized: false }
};

const tables = [
    'pvz_points',
    'employees',
    'documents',
    'transfers',
    'financial_transactions',
    'shifts',
    'expense_requests',
    'rent_contracts',
    'fact_payroll',
    'fact_wb_revenues'
];

async function sync() {
    const localClient = new pg.Client(localConfig);
    const remoteClient = new pg.Client(remoteConfig);

    try {
        console.log('Connecting to databases...');
        await localClient.connect();
        await remoteClient.connect();

        for (const table of tables) {
            console.log(`Syncing table: ${table}...`);

            // 1. Get data from local
            const { rows } = await localClient.query(`SELECT * FROM ${table}`);
            if (rows.length === 0) {
                console.log(`  No data in ${table}, skipping.`);
                continue;
            }

            // 2. Clear remote table
            await remoteClient.query(`TRUNCATE TABLE ${table} CASCADE`);

            // 3. Insert data
            const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(', ');

            for (const row of rows) {
                const values = Object.values(row);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

                const query = `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`;
                await remoteClient.query(query, values);
            }

            console.log(`  Transferred ${rows.length} rows.`);
        }

        console.log('Sync completed successfully! ✅');

    } catch (err) {
        console.error('Error syncing database:', err);
    } finally {
        await localClient.end();
        await remoteClient.end();
    }
}

sync();
