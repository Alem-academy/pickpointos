import { getSheetData } from './src/sheets-client.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSheets() {
    try {
        console.log('🚀 Testing Google Sheets access...');
        const sheetId = process.env.GOOGLE_SHEET_ID;
        console.log('Sheet ID:', sheetId);

        const header = await getSheetData(sheetId, 'A1:Z1');
        console.log('✅ Success! Header:', header[0]);
    } catch (error) {
        console.error('❌ Sheets access failed:', error.message);
    }
}

testSheets();
