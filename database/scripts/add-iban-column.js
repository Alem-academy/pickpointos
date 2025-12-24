import { query } from '../../parser/src/db-client.js';

async function run() {
    try {
        console.log('Adding iban column to employees table...');
        await query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS iban VARCHAR(34);
        `);
        console.log('Successfully added iban column.');
    } catch (err) {
        console.error('Error adding column:', err);
    }
}

run();
