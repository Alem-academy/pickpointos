import pg from 'pg';

const remoteConfig = {
    connectionString: 'postgresql://postgres:pKiZMgnZbFXFiEtpLNQroHJgxQdyLzmn@ballast.proxy.rlwy.net:37940/railway',
    ssl: { rejectUnauthorized: false }
};

async function checkUser() {
    const client = new pg.Client(remoteConfig);
    try {
        await client.connect();
        console.log('Connected to Railway DB...');

        const email = 'admin@pvz.kz';
        const res = await client.query('SELECT * FROM employees WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log(`✅ User ${email} found!`);
            console.log('Role:', res.rows[0].role);
            console.log('ID:', res.rows[0].id);
        } else {
            console.log(`❌ User ${email} NOT found!`);

            // Try to fix it by inserting
            console.log('Attemping to create admin user...');
            await client.query(`
                INSERT INTO employees 
                (id, iin, full_name, email, phone, role, status, base_rate, hired_at, password_hash) 
                VALUES 
                ('650e8400-e29b-41d4-a716-446655440000', '000000000000', 'Super Admin', 'admin@pvz.kz', '+7 (700) 000-00-00', 'admin', 'active', 0, '2020-01-01', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.')
                ON CONFLICT (email) DO NOTHING
            `);
            console.log('Admin user created/restored.');
        }

    } catch (err) {
        console.error('Error checking user:', err);
    } finally {
        await client.end();
    }
}

checkUser();
