import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const client = await pool.connect();
    try {
        // Find Айдар Нурланов
        const empResult = await client.query(
            `SELECT id, full_name, status FROM employees WHERE full_name ILIKE '%айдар%' OR full_name ILIKE '%нурланов%'`
        );
        console.log('=== Employees matching Айдар ===');
        empResult.rows.forEach(r => console.log(r.id, r.full_name, r.status));

        for (const emp of empResult.rows) {
            const docsResult = await client.query(
                `SELECT id, type, status, scan_url IS NOT NULL as has_scan, created_at FROM documents WHERE employee_id = $1 ORDER BY created_at DESC`,
                [emp.id]
            );
            console.log(`\n=== Documents for ${emp.full_name} (${emp.id}) ===`);
            if (docsResult.rows.length === 0) {
                console.log('  NO DOCUMENTS');
            } else {
                docsResult.rows.forEach(r => console.log(' ', r.type, r.status, r.has_scan, r.created_at));
            }
        }

        // All recent docs
        const allDocs = await client.query(
            `SELECT d.type, d.status, e.full_name, d.created_at FROM documents d LEFT JOIN employees e ON e.id = d.employee_id ORDER BY d.created_at DESC LIMIT 15`
        );
        console.log('\n=== Last 15 documents total ===');
        allDocs.rows.forEach(r => console.log(' ', r.type, r.status, r.full_name, new Date(r.created_at).toLocaleDateString('ru-RU')));
    } finally {
        client.release();
        await pool.end();
    }
}
check().catch(console.error);
