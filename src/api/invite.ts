import axiosInstance from './client';
import type { Employee } from '../services/api';

export const inviteApi = {
    async getInviteData(token: string): Promise<{ employee: Employee }> {
        try {
            const res = await axiosInstance.get(`/invite/${token}`);
            return res.data;
        } catch (e: any) {
            throw new Error(e.response?.data?.error || "Недействительная или просроченная ссылка приглашения");
        }
    },

    async verifyInvite(token: string, iin: string): Promise<{ success: boolean }> {
        try {
            const res = await axiosInstance.post(`/invite/${token}/verify`, { iin });
            return res.data;
        } catch (e: any) {
            throw new Error(e.response?.data?.error || "Ошибка верификации подписи на сервере");
        }
    }
};
