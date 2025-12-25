import axiosInstance from './client';

export const analyticsApi = {
    async getAnalyticsDashboard(month?: string): Promise<any> {
        const res = await axiosInstance.get('/analytics/dashboard', { params: { month } });
        return res.data;
    },

    async getHRStats(): Promise<any> {
        const res = await axiosInstance.get('/analytics/hr-stats');
        return res.data;
    },

    async getRFStats(): Promise<any> {
        const res = await axiosInstance.get('/analytics/rf-stats');
        return res.data;
    },
};
