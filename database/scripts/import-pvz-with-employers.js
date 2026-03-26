/**
 * Import PVZ from CSV with employer linkage
 * Usage: node database/scripts/import-pvz-with-employers.js
 */

import { readFileSync } from 'fs';
import { createClient } from '../lib/connection.js';

const CSV_PATH = './точки.csv';

// Employer name to ID mapping
const EMPLOYER_MAP = {
    'ИП Жасмин': null,  // Will be filled from DB
    'ИП Ориентал': null,
    'ТОО PVZ.kz': null
};

async function importPVZ() {
    const client = await createClient();
    
    try {
        console.log('📊 Fetching employers from DB...');
        const employers = await client.query('SELECT id, name_full FROM employers');
        
        // Map employer names to IDs
        employers.rows.forEach(emp => {
            if (emp.name_full.includes('Жасмин')) EMPLOYER_MAP['ИП Жасмин'] = emp.id;
            else if (emp.name_full.includes('Ориентал')) EMPLOYER_MAP['ИП Ориентал'] = emp.id;
            else if (emp.name_full.includes('PVZ')) EMPLOYER_MAP['ТОО PVZ.kz'] = emp.id;
        });
        
        console.log('✅ Employers mapped:');
        Object.entries(EMPLOYER_MAP).forEach(([name, id]) => {
            console.log(`   ${name}: ${id || '❌ NOT FOUND'}`);
        });
        
        // Read CSV
        console.log('\n📖 Reading CSV file...');
        const csvContent = readFileSync(CSV_PATH, 'utf-8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(';');
        
        console.log(`✅ Found ${lines.length - 1} PVZ entries\n`);
        
        let created = 0;
        let updated = 0;
        let errors = 0;
        
        // Skip header, process each line
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';');
            const row = {};
            headers.forEach((header, idx) => {
                row[header.trim()] = values[idx]?.trim();
            });
            
            const wbId = row['ID ПВЗ'];
            const address = row['Адрес ПВЗ'];
            const regionId = row['ID региона'];
            const manager = row['Руководитель филиалов'];
            const companyName = row['Компания'];
            
            // Get employer ID
            const employerId = EMPLOYER_MAP[companyName];
            if (!employerId) {
                console.log(`❌ Row ${i}: Unknown company "${companyName}"`);
                errors++;
                continue;
            }
            
            // Generate PVZ name from address (first part before comma)
            const pvzName = `ПВЗ ${address.split(',')[0]}`;
            
            try {
                // Check if PVZ exists
                const existing = await client.query('SELECT id FROM pvz_points WHERE wb_id = $1', [wbId]);
                
                if (existing.rows.length > 0) {
                    // Update existing
                    await client.query(`
                        UPDATE pvz_points 
                        SET address = $1, region_id = $2, name = $3, employer_id = $4, updated_at = NOW()
                        WHERE wb_id = $5
                    `, [address, regionId, pvzName, employerId, wbId]);
                    updated++;
                    console.log(`✏️  Updated: ${pvzName} (${companyName})`);
                } else {
                    // Insert new
                    await client.query(`
                        INSERT INTO pvz_points (wb_id, name, address, region_id, brand, employer_id, is_active)
                        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
                    `, [wbId, pvzName, address, regionId, 'Wildberries', employerId]);
                    created++;
                    console.log(`✅ Created: ${pvzName} (${companyName})`);
                }
            } catch (err) {
                console.log(`❌ Error for row ${i}: ${err.message}`);
                errors++;
            }
        }
        
        console.log('\n========== SUMMARY ==========');
        console.log(`✅ Created: ${created}`);
        console.log(`✏️  Updated: ${updated}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`=============================`);
        
    } catch (err) {
        console.error('❌ Import failed:', err.message);
    } finally {
        await client.end();
    }
}

importPVZ();
