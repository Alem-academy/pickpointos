import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function cleanup() {
    const client = await pool.connect();
    try {
        // IDs to DELETE (empty duplicates)
        const toDelete = [
            '080faecc-a266-4f07-94e7-0462d7659c48',  // 0 documents
            '16009c3e-ca13-4d38-bbee-a8303e65c684',  // 1 document (new duplicate)
        ];
        // ID to KEEP
        const keepId = 'b6adcd89-8f1a-4bbe-b1dc-421025490b0e'; // 16 documents

        console.log('Keeping employee:', keepId);

        // Move any documents from the 1-document duplicate to the real profile
        const moved = await client.query(
            `UPDATE documents SET employee_id = $1 WHERE employee_id = $2 RETURNING id, type`,
            [keepId, '16009c3e-ca13-4d38-bbee-a8303e65c684']
        );
        console.log('Moved documents:', moved.rows.map(r => r.type));

        // Delete the empty duplicates
        for (const id of toDelete) {
            await client.query('DELETE FROM employees WHERE id = $1', [id]);
            console.log('Deleted duplicate:', id);
        }

        // Verify
        const result = await client.query(
            `SELECT id, full_name, status FROM employees WHERE full_name ILIKE '%нурланов%'`
        );
        console.log('\n=== Remaining Нурланов employees ===');
        result.rows.forEach(r => console.log(r.id, r.full_name, r.status));

        const docs = await client.query(
            `SELECT type, status FROM documents WHERE employee_id = $1 ORDER BY created_at DESC`,
            [keepId]
        );
        console.log('\n=== Documents on kept profile ===');
        docs.rows.forEach(r => console.log(' ', r.type, r.status));
    } finally {
        client.release();
        await pool.end();
    }
}
cleanup().catch(console.error);
