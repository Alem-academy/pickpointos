import axiosInstance from './client';
import type { PVZ, Shift } from '../services/api';

export const operationsApi = {
    async getPvzList(): Promise<PVZ[]> {
        const res = await axiosInstance.get('/pvz');
        return res.data;
    },

    async createPvz(data: { name: string; address: string; brand: string; area: number }): Promise<PVZ> {
        const res = await axiosInstance.post('/pvz/new', data);
        return res.data;
    },

    async getPvzChecklist(pvzId: string): Promise<any[]> {
        const res = await axiosInstance.get(`/pvz/checklist/${pvzId}`);
        return res.data;
    },

    async updateChecklistItem(pvzId: string, itemId: string, status: string): Promise<any> {
        const res = await axiosInstance.patch(`/pvz/checklist/${pvzId}/item/${itemId}`, { status });
        return res.data;
    },

    async getTimesheet(month: string, pvzId?: string): Promise<any[]> {
        const res = await axiosInstance.get('/timesheets', { params: { month, pvzId } });
        return res.data;
    },

    async approveTimesheet(month: string, pvzId?: string): Promise<{ message: string }> {
        const res = await axiosInstance.post('/timesheets/approve', { month, pvzId });
        return res.data;
    },

    async getShifts(pvzId?: string, start?: string, end?: string): Promise<Shift[]> {
        const res = await axiosInstance.get('/shifts', { params: { pvzId, start, end } });
        return res.data;
    },

    async generateSchedule(data: { pvzId: string; teamA: string[]; teamB: string[]; startDate: string; endDate: string }): Promise<{ success: boolean; count: number }> {
        const res = await axiosInstance.post('/shifts/generate', data);
        return res.data;
    },

    async createShift(data: Partial<Shift>): Promise<Shift> {
        const res = await axiosInstance.post('/shifts', data);
        return res.data;
    },

    async updateShift(id: string, data: Partial<Shift>): Promise<Shift> {
        const res = await axiosInstance.patch(`/shifts/${id}`, data);
        return res.data;
    },

    async deleteShift(id: string): Promise<{ message: string; id: string }> {
        const res = await axiosInstance.delete(`/shifts/${id}`);
        return res.data;
    },

    async triggerParser(sheetId?: string): Promise<{ message: string; stats: any }> {
        const res = await axiosInstance.post('/parse', { sheetId });
        return res.data;
    },
};
