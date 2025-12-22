import api from './api';
import type { User } from '@/types';

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        const response = await api.post('/auth/login', { email, password });
        return { ...response.data.user, token: response.data.token };
    },

    logout: async (): Promise<void> => {
        // Optional: Call backend logout if you implement token blacklisting
        localStorage.removeItem('user');
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            // Validate token with backend
            const response = await api.get('/auth/me');
            // Assuming /auth/me returns the user object without token
            // We need to keep the token from localStorage
            const storedUserStr = localStorage.getItem('user');
            const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

            if (storedUser && storedUser.token) {
                return { ...response.data, token: storedUser.token };
            }
            return response.data;
        } catch (error) {
            console.error('Session expired or invalid:', error);
            localStorage.removeItem('user');
            return null;
        }
    },
};
