import { getSheetData } from '../sheets-client.js';
import { getClient } from '../lib/db.js';

// Mapping based on user description
// ID ПВЗ, Регион, Адрес, Дата, Оборот, Продажа по тарифу, Возврат по тарифу, ...
// Mapping is now fetched from DB
// ID ПВЗ, Регион, Адрес, Дата, Оборот, Продажа по тарифу, Возврат по тарифу, ...

async function ensurePvzExists(client, name, address, region) {
    // Try to find by name
    const res = await client.query('SELECT id FROM pvz_points WHERE name = $1', [name]);
    if (res.rows.length > 0) {
        return res.rows[0].id;
    }

    // Create if not exists
    const insertRes = await client.query(`
        INSERT INTO pvz_points (name, address, region_id, brand)
        VALUES ($1, $2, $3, 'Wildberries')
        RETURNING id
    `, [name, address, region]);

    console.log(`✨ Created new PVZ: ${name}`);
    return insertRes.rows[0].id;
}

async function getMapping(client, headers) {
    // 1. Fetch all active mappings
    const res = await client.query('SELECT * FROM import_mappings WHERE is_active = true');
    const mappings = res.rows;

    // 2. Find best match based on headers
    for (const m of mappings) {
        const mapKeys = Object.keys(m.mapping);
        // Check if required keys exist in headers
        // For now, let's say if 50% of keys match, it's a candidate
        const matchCount = mapKeys.filter(k => headers.includes(k)).length;
        if (matchCount > mapKeys.length * 0.5) {
            console.log(`✅ Found matching mapping: ${m.name}`);
            return m.mapping;
        }
    }
    return null;
}

function parseAmount(value) {
    if (!value) return 0;
    // Remove spaces and replace comma with dot
    const clean = value.toString().replace(/\s/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

function parseDate(value) {
    if (!value) return new Date();
    // Assuming DD.MM.YYYY format
    const parts = value.split('.');
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(value);
}

export const parseSheet = async (sheetId) => {
    const client = await getClient();
    let stats = {
        processed: 0,
        inserted: 0,
        errors: 0
    };

    try {
        console.log('🔌 Acquired DB client from pool');

        // 1. Read Headers
        const headerRows = await getSheetData(sheetId, 'A1:Z1');
        const headers = headerRows[0];
        console.log('Headers:', headers);

        // 1.5 Find Mapping
        const mapping = await getMapping(client, headers);
        if (!mapping) {
            console.error('❌ No matching mapping found for headers:', headers);
            return stats;
        }

        // Map header names to indices
        const colIndices = {};
        headers.forEach((h, i) => {
            colIndices[h] = i;
        });

        // 2. Read Data (Small chunk for testing)
        const data = await getSheetData(sheetId, 'A2:Z10000'); // Changed from Z50 to Z10000

        if (!data || data.length === 0) {
            console.log('No data found');
            return stats;
        }

        console.log(`Processing ${data.length} rows...`);

        await client.query('BEGIN');

        for (const row of data) {
            try {
                const pvzName = row[colIndices['ID ПВЗ']];
                if (!pvzName) continue;

                stats.processed++;

                // 1. Resolve PVZ
                const address = row[colIndices['Адрес']] || 'Unknown';
                const region = row[colIndices['Регион']] || 'Unknown';
                const pvzId = await ensurePvzExists(client, pvzName, address, region);

                // 2. Extract Date
                const dateStr = row[colIndices['Дата']];
                const transactionDate = parseDate(dateStr);

                // 3. Process Financial Columns
                for (const [colName, config] of Object.entries(mapping)) {
                    if (typeof config === 'object' && colIndices[colName] !== undefined) {
                        const amount = parseAmount(row[colIndices[colName]]);
                        if (amount !== 0) {
                            await client.query(`
                                INSERT INTO financial_transactions 
                                (pvz_id, type, amount, transaction_date, source, description)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                ON CONFLICT (pvz_id, transaction_date, type, source, amount) DO NOTHING
                            `, [
                                pvzId,
                                config.type,
                                amount,
                                transactionDate,
                                'wb_sheet',
                                config.source
                            ]);
                            stats.inserted++;
                        }
                    }
                }

            } catch (err) {
                console.error('Error processing row:', err);
                stats.errors++;
            }
        }

        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

    return stats;
};
