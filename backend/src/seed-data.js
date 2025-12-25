import { createClient } from './lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
    const client = createClient();
    try {
        await client.connect();
        console.log('🌱 Starting seed...');

        // 1. Create PVZ
        let pvzId;
        const existingPvz = await client.query('SELECT id FROM pvz_points WHERE name = $1', ['PVZ-TEST-01']);

        if (existingPvz.rows.length > 0) {
            pvzId = existingPvz.rows[0].id;
            console.log('✅ PVZ found:', pvzId);
        } else {
            const pvzRes = await client.query(`
                INSERT INTO pvz_points (name, address, brand, region_id)
                VALUES ('PVZ-TEST-01', 'Test Address 1', 'Wildberries', 'Almaty')
                RETURNING id
            `);
            pvzId = pvzRes.rows[0].id;
            console.log('✅ PVZ created:', pvzId);
        }

        // 2. Create Transactions (Revenue & OpEx)
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Revenue
        await client.query(`
            INSERT INTO financial_transactions (pvz_id, type, amount, transaction_date, source, description)
            VALUES 
                ($1, 'revenue', 150000, $2, 'manual', 'Daily Revenue'),
                ($1, 'revenue', 200000, $2, 'manual', 'Tariff Sales')
            ON CONFLICT (pvz_id, transaction_date, type, source, amount) DO NOTHING
        `, [pvzId, startOfMonth]);

        // OpEx
        await client.query(`
            INSERT INTO financial_transactions (pvz_id, type, amount, transaction_date, source, description)
            VALUES 
                ($1, 'expense', 5000, $2, 'manual', 'Office Supplies'),
                ($1, 'expense', 12000, $2, 'manual', 'Internet')
            ON CONFLICT (pvz_id, transaction_date, type, source, amount) DO NOTHING
        `, [pvzId, startOfMonth]);

        console.log('✅ Financial transactions seeded');

        // 3. Create Employees (Kazakh Mock Data)
        const employees = [
            { iin: '900101300456', name: 'Алиев Арман', role: 'rf' },
            { iin: '950515400123', name: 'Сейфуллин Сакен', role: 'employee' },
            { iin: '880320300789', name: 'Иванова Мария', role: 'hr' },
            { iin: '010101500654', name: 'Ким Дмитрий', role: 'employee' },
            { iin: '991231400987', name: 'Омарова Айгуль', role: 'employee' }
        ];

        for (const emp of employees) {
            const empRes = await client.query(`
                INSERT INTO employees (iin, full_name, role, status, main_pvz_id)
                VALUES ($1, $2, $3, 'active', $4)
                ON CONFLICT (iin) DO UPDATE SET status = 'active'
                RETURNING id
            `, [emp.iin, emp.name, emp.role, pvzId]);

            const empId = empRes.rows[0].id;

            // Add payroll for them
            await client.query(`
                INSERT INTO fact_payroll (pvz_id, employee_id, month, total_hours, rate, total_amount, status)
                VALUES ($1, $2, $3, 160, 1000, 160000, 'calculated')
                ON CONFLICT (employee_id, month) DO NOTHING
            `, [pvzId, empId, startOfMonth]);
        }

        console.log(`✅ Seeded ${employees.length} employees with payroll`);

    } catch (err) {
        console.error('❌ Seed failed:', err);
    } finally {
        await client.end();
    }
};

seed();
