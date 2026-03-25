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

async function reassignEmployees() {
    await client.connect();
    
    console.log('🔄 Reassigning employees from old PVZ to new ones...\n');
    
    // Астана 29 (Кабанбай батыра 45/3) -> Астана 26 (Кабанбай Батыр, 40)
    await reassign('304673', '50062171', 'Астана 29', 'Астана 26');
    
    // Астана Север -> Астана 33
    await reassign('304674', '312008', 'Астана Север', 'Астана 33');
    
    // Шымкент Юг -> find any Шымкент PVZ
    const shymkentPVZ = await client.query(
        "SELECT wb_id, name FROM pvz_points WHERE address LIKE '%Шымкент%' LIMIT 1"
    );
    if (shymkentPVZ.rows.length > 0) {
        await reassign('304675', shymkentPVZ.rows[0].wb_id, 'Шымкент Юг', shymkentPVZ.rows[0].name);
    } else {
        console.log('⚠️  No Шымкент PVZ found to reassign to');
    }
    
    // Now delete old PVZ
    console.log('\n🗑️  Deleting old PVZ...\n');
    
    const oldWBIds = ['304673', '304674', '304675'];
    for (const wbId of oldWBIds) {
        const empCheck = await client.query(
            'SELECT COUNT(*) as count FROM employees WHERE main_pvz_id = (SELECT id FROM pvz_points WHERE wb_id = $1)',
            [wbId]
        );
        
        if (parseInt(empCheck.rows[0].count) > 0) {
            console.log(`⚠️  SKIP delete WB ${wbId} - still has ${empCheck.rows[0].count} employees`);
            continue;
        }
        
        const result = await client.query(
            'DELETE FROM pvz_points WHERE wb_id = $1 RETURNING name',
            [wbId]
        );
        
        if (result.rows.length > 0) {
            console.log(`✅ Deleted: ${result.rows[0].name} (WB: ${wbId})`);
        }
    }
    
    const count = await client.query('SELECT COUNT(*) as total FROM pvz_points');
    console.log(`\n📊 Total PVZ remaining: ${count.rows[0].total}`);
    
    await client.end();
}

async function reassign(oldWb, newWb, oldName, newName) {
    const oldPVZ = await client.query('SELECT id FROM pvz_points WHERE wb_id = $1', [oldWb]);
    const newPVZ = await client.query('SELECT id FROM pvz_points WHERE wb_id = $1', [newWb]);
    
    if (oldPVZ.rows.length === 0 || newPVZ.rows.length === 0) {
        console.log(`⚠️  SKIP reassign: ${oldName} -> ${newName} (PVZ not found)`);
        return;
    }
    
    const result = await client.query(
        'UPDATE employees SET main_pvz_id = $1 WHERE main_pvz_id = $2 RETURNING full_name',
        [newPVZ.rows[0].id, oldPVZ.rows[0].id]
    );
    
    if (result.rows.length > 0) {
        console.log(`✅ Reassigned ${result.rows.length} employees:`);
        console.log(`   FROM: ${oldName} (WB: ${oldWb})`);
        console.log(`   TO:   ${newName} (WB: ${newWb})`);
        result.rows.forEach(r => console.log(`   - ${r.full_name}`));
    } else {
        console.log(`⚠️  No employees to reassign: ${oldName} -> ${newName}`);
    }
}

reassignEmployees().catch(console.error);
