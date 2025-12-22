import express from 'express';
import { query } from '../db-client.js';
import redis from '../redis-client.js';

const router = express.Router();

// GET /dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // Try to get from cache first
        const { month } = req.query;
        const cacheKey = `analytics:dashboard:${month || 'current'}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            console.log('Serving analytics from cache');
            return res.json(JSON.parse(cachedData));
        }

        const now = new Date();
        const targetDate = month ? new Date(month) : now;
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        // 1. Aggregates
        const financialsRes = await query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as opex
            FROM financial_transactions
            WHERE transaction_date >= $1 AND transaction_date <= $2
        `, [startOfMonth, endOfMonth]);

        const payrollRes = await query(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM fact_payroll
            WHERE month = $1
        `, [startOfMonth]);

        const revenue = parseFloat(financialsRes.rows[0].revenue);
        const opex = Math.abs(parseFloat(financialsRes.rows[0].opex));
        const payroll = parseFloat(payrollRes.rows[0].total);
        const netProfit = revenue - opex - payroll;

        // 2. Check for Parser Data (Missing Data Warning)
        const parserCheckRes = await query(`
            SELECT EXISTS(
                SELECT 1 FROM financial_transactions 
                WHERE source = 'wb_sheet' 
                AND transaction_date >= $1 AND transaction_date <= $2
            ) as has_parser_data
        `, [startOfMonth, endOfMonth]);

        const hasParserData = parserCheckRes.rows[0].has_parser_data;

        // 3. Top PVZ
        const topPvzRes = await query(`
            SELECT p.name, COALESCE(SUM(ft.amount), 0) as revenue
            FROM pvz_points p
            LEFT JOIN financial_transactions ft ON p.id = ft.pvz_id 
                AND ft.type = 'revenue' 
                AND ft.transaction_date >= $1 AND ft.transaction_date <= $2
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 5
        `, [startOfMonth, endOfMonth]);

        // 4. Recent Activity (Fetching latest transactions)
        const activityRes = await query(`
            SELECT 
                ft.id,
                ft.type as action,
                ft.description as detail,
                to_char(ft.created_at, 'HH24:MI') as time
            FROM financial_transactions ft
            ORDER BY ft.created_at DESC
            LIMIT 5
        `);

        // If no real activity, provide some mocks for UI testing
        let recentActivity = activityRes.rows.map(r => ({
            id: r.id,
            action: r.action === 'revenue' ? 'Поступление' : 'Расход',
            detail: r.detail || 'Финансовая операция',
            time: r.time
        }));

        if (recentActivity.length === 0) {
            recentActivity = [
                { id: 'm1', action: 'Система', detail: 'Синхронизация данных', time: '10:00' },
                { id: 'm2', action: 'HR', detail: 'Новый кандидат', time: '09:45' }
            ];
        }

        const responseData = {
            revenue,
            opex,
            payroll,
            netProfit,
            hasParserData, // Flag for frontend warning
            isIntermediate: !hasParserData, // If no parser data, calculations are intermediate
            topPvz: topPvzRes.rows,
            recentActivity
        };

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(responseData));

        res.json(responseData);

    } catch (err) {
        console.error('Error fetching analytics dashboard:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /hr-stats
router.get('/hr-stats', async (req, res) => {
    try {
        const totalEmployeesRes = await query(`SELECT COUNT(*) as count FROM employees WHERE status = 'active'`);
        const newHiresRes = await query(`
            SELECT COUNT(*) as count FROM employees 
            WHERE status = 'active' AND hired_at >= date_trunc('month', CURRENT_DATE)
        `);
        const pendingAppsRes = await query(`SELECT COUNT(*) as count FROM employees WHERE status IN ('new', 'review')`);

        // Recent activity: simply latest created employees for now
        const recentActivityRes = await query(`
            SELECT id, full_name, status, created_at 
            FROM employees 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        res.json({
            totalEmployees: parseInt(totalEmployeesRes.rows[0].count),
            newHires: parseInt(newHiresRes.rows[0].count),
            pendingApplications: parseInt(pendingAppsRes.rows[0].count),
            recentActivity: recentActivityRes.rows
        });
    } catch (err) {
        console.error('Error fetching HR stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /rf-stats
router.get('/rf-stats', async (req, res) => {
    try {
        // For dev/demo, if no pvz_id on user, pick the first one
        let pvzId = req.user?.pvz_id;

        if (!pvzId) {
            const firstPvz = await query('SELECT id FROM pvz_points LIMIT 1');
            if (firstPvz.rows.length > 0) {
                pvzId = firstPvz.rows[0].id;
            }
        }

        if (!pvzId) {
            return res.status(404).json({ error: 'No PVZ assigned or found' });
        }

        const pvzInfoRes = await query('SELECT * FROM pvz_points WHERE id = $1', [pvzId]);
        const pvz = pvzInfoRes.rows[0];

        // Today's Shift
        const shiftsRes = await query(`
            SELECT s.*, e.full_name as employee_name
            FROM shifts s
            JOIN employees e ON s.employee_id = e.id
            WHERE s.pvz_id = $1 AND s.date = CURRENT_DATE
        `, [pvzId]);

        // Monthly Expenses
        const expensesRes = await query(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expense_requests
            WHERE pvz_id = $1 
            AND created_at >= date_trunc('month', CURRENT_DATE)
            AND status = 'approved'
        `, [pvzId]);

        res.json({
            pvz,
            todaysShifts: shiftsRes.rows,
            monthlyExpenses: parseFloat(expensesRes.rows[0].total)
        });

    } catch (err) {
        console.error('Error fetching RF stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
