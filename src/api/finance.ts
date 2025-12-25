import axiosInstance from './client';
import type { ExpenseRequest, PayrollRecord, PnLReport } from '../services/api';

export const financeApi = {
    async getRentOverview(): Promise<any[]> {
        const res = await axiosInstance.get('/finance/rent');
        return res.data;
    },

    async payRent(pvzId: string, month: string, amount: number): Promise<{ success: boolean }> {
        const res = await axiosInstance.post('/finance/rent/pay', { pvzId, month, amount });
        return res.data;
    },

    async getExpenses(status?: string): Promise<ExpenseRequest[]> {
        const res = await axiosInstance.get('/finance/expenses', { params: { status } });
        return res.data;
    },

    async createExpense(data: { pvzId: string; amount: number; category: string; description: string }): Promise<ExpenseRequest> {
        const res = await axiosInstance.post('/finance/expenses', data);
        return res.data;
    },

    async updateExpenseStatus(id: string, status: 'approved' | 'rejected'): Promise<ExpenseRequest> {
        const res = await axiosInstance.patch(`/finance/expenses/${id}/status`, { status });
        return res.data;
    },

    async calculatePayroll(data: { pvzId: string; month: string }): Promise<PayrollRecord[]> {
        const res = await axiosInstance.post('/finance/payroll/calculate', data);
        return res.data;
    },

    async getPnL(pvzId: string, month: string): Promise<PnLReport> {
        const res = await axiosInstance.get('/finance/pnl', { params: { pvzId, month } });
        return res.data;
    },
};
