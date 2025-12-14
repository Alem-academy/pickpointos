import { parseSheet } from './src/parser.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    try {
        console.log('🚀 Starting local parser test...');
        const sheetId = process.env.GOOGLE_SHEET_ID;
        console.log('Sheet ID:', sheetId);

        const stats = await parseSheet(sheetId);
        console.log('✅ Parse completed:', stats);
    } catch (error) {
        console.error('❌ Parse failed:', error);
    }
}

run();
