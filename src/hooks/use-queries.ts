import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/services/api';
import type { HRStats, RFStats, Employee, ExpenseRequest, PnLReport } from '@/types/schemas';

// HR Hooks
export const useHRStats = () => {
    return useQuery<HRStats>({
        queryKey: ['hr-stats'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/analytics/hr-stats');
            return data;
        },
    });
};

export const useEmployees = (statusFilter?: string) => {
    return useQuery<Employee[]>({
        queryKey: ['employees', statusFilter],
        queryFn: async () => {
            const params = statusFilter ? { status: statusFilter } : {};
            const { data } = await axiosInstance.get('/employees', { params });
            return data;
        },
    });
};

// RF Hooks
export const useRFStats = () => {
    return useQuery<RFStats>({
        queryKey: ['rf-stats'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/analytics/rf-stats');
            return data;
        },
    });
};
// Finance Hooks
export const useExpenses = (status?: string) => {
    return useQuery<ExpenseRequest[]>({
        queryKey: ['expenses', status],
        queryFn: async () => {
            const params = status ? { status } : {};
            const { data } = await axiosInstance.get('/finance/expenses', { params });
            return data;
        },
    });
};

export const usePnL = (pvzId: string, month: string) => {
    return useQuery<PnLReport>({
        queryKey: ['pnl', pvzId, month],
        queryFn: async () => {
            if (!pvzId || !month) return null;
            const { data } = await axiosInstance.get('/finance/pnl', { params: { pvzId, month } });
            return data;
        },
        enabled: !!pvzId && !!month,
    });
};

export const useRent = () => {
    return useQuery<any[]>({
        queryKey: ['rent'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/finance/rent');
            return data;
        },
    });
};

// Analytics Hooks
export const useAnalytics = () => {
    return useQuery<any>({
        queryKey: ['analytics-dashboard'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/analytics/dashboard');
            return data;
        },
    });
};
