import { createClient } from '../../parser/src/db-client.js';
import dotenv from 'dotenv';
dotenv.config();

const closeShifts = async () => {
    const client = createClient();
    await client.connect();

    try {
        console.log('Closing shifts...');
        const res = await client.query(`
            UPDATE shifts 
            SET status = 'closed', actual_hours = 12 
            WHERE status = 'pending'
            RETURNING id
        `);
        console.log(`Updated ${res.rowCount} shifts.`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
};

closeShifts();
