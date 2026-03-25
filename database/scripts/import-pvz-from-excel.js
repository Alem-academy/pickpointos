/**
 * Import PVZ from Excel file
 * Usage: node database/scripts/import-pvz-from-excel.js
 */

import { readFileSync } from 'fs';
import * as XLSX from 'xlsx';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function importPVZ() {
    console.log('📖 Reading Excel file...');
    
    const workbook = XLSX.read(readFileSync('/Users/mac/.aionui/qwen-temp-1774423787714/ПВЗ_структурированные_данные (1).xlsx'), { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Skip header row
    const rows = data.slice(1);
    
    console.log(`📊 Found ${rows.length} PVZ in Excel file\n`);
    
    await client.connect();
    
    // Get existing PVZ from database
    const existingResult = await client.query('SELECT wb_id, id FROM pvz_points');
    const existingPVZ = new Map(existingResult.rows.map(r => [r.wb_id, r.id]));
    
    console.log(`💾 Found ${existingPVZ.size} existing PVZ in database\n`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
        const [id, no, wbId, address, regionId, manager, dolgovic] = row;
        
        if (!address || !regionId) {
            console.log(`⚠️  Skipping row ${no}: Missing address or region`);
            skipped++;
            continue;
        }
        
        // Extract city/region name from address
        let cityName = '';
        if (address.includes('Алматы')) cityName = 'Алматы';
        else if (address.includes('Астана')) cityName = 'Астана';
        else if (address.includes('Шымкент')) cityName = 'Шымкент';
        else if (address.includes('Капшагай')) cityName = 'Капшагай';
        else if (address.includes('Есик')) cityName = 'Есик';
        else if (address.includes('Талдыкорган')) cityName = 'Талдыкорган';
        else cityName = 'Регион ' + regionId;
        
        // Generate PVZ name
        const pvzName = `ПВЗ ${cityName} ${no}`;
        
        try {
            if (existingPVZ.has(String(wbId))) {
                // Update existing
                await client.query(`
                    UPDATE pvz_points 
                    SET address = $1, region_id = $2, name = $3, updated_at = NOW()
                    WHERE wb_id = $4
                `, [address, String(regionId), pvzName, String(wbId)]);
                updated++;
                console.log(`✏️  Updated: ${pvzName} (${address})`);
            } else {
                // Create new
                await client.query(`
                    INSERT INTO pvz_points (wb_id, name, address, region_id, brand, is_active)
                    VALUES ($1, $2, $3, $4, $5, TRUE)
                    RETURNING id
                `, [String(wbId), pvzName, address, String(regionId), 'Wildberries']);
                created++;
                console.log(`✅ Created: ${pvzName} (${address})`);
            }
        } catch (err) {
            console.log(`❌ Error for row ${no}: ${err.message}`);
            skipped++;
        }
    }
    
    await client.end();
    
    console.log('\n========== SUMMARY ==========');
    console.log(`✅ Created: ${created}`);
    console.log(`✏️  Updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`=============================`);
}

importPVZ()
    .then(() => {
        console.log('\n✅ Import completed!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Import failed:', err);
        process.exit(1);
    });
