import axiosInstance from './client';
import type { User } from '../types';

export const authApi = {
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        const res = await axiosInstance.post('/auth/login', { email, password });
        return res.data;
    },

    async me(): Promise<User> {
        const res = await axiosInstance.get('/auth/me');
        return res.data;
    },
};
