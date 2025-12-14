import { createClient } from '../../parser/src/db-client.js';
import dotenv from 'dotenv';
dotenv.config();

const updateRates = async () => {
    const client = createClient();
    await client.connect();

    try {
        console.log('Updating base rates...');
        const res = await client.query(`
            UPDATE employees 
            SET base_rate = 5000 
            WHERE base_rate IS NULL
        `);
        console.log(`Updated ${res.rowCount} employees.`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
};

updateRates();
