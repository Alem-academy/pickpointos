import axiosInstance from './client';
import type { Employee } from '../services/api';

// MOCK LOCAL STORAGE FOR INVITES (Since Real Backend is external)
const getMockInvites = () => JSON.parse(localStorage.getItem('mock_invites') || '{}');
const setMockInvites = (invites: any) => localStorage.setItem('mock_invites', JSON.stringify(invites));

export const inviteApi = {
    async getInviteData(token: string): Promise<{ employee: Employee }> {
        // First try to hit the real backend if it's ready. If it 404s, fallback to mock.
        try {
            const res = await axiosInstance.get(`/invite/${token}`);
            return res.data;
        } catch (e: any) {
            console.log("Real backend failed, falling back to mock DB for invite data...");
            const invites = getMockInvites();
            if (invites[token]) {
                return { employee: invites[token] };
            }
            throw new Error("Invalid or expired invite token");
        }
    },

    async verifyInvite(token: string, iin: string): Promise<{ success: boolean }> {
        // Try real backend
        try {
            const res = await axiosInstance.post(`/invite/${token}/verify`, { iin });
            return res.data;
        } catch (e: any) {
            console.log("Real backend failed, falling back to mock DB for invite verification...");
            const invites = getMockInvites();
            if (invites[token]) {
                const employee = invites[token];
                employee.iin = iin;
                employee.status = 'active';
                // Remove token to simulate single-use
                delete invites[token];
                setMockInvites(invites);

                // We should also ideally update the employee list in backend if we can, but since it's mock:
                try {
                    await axiosInstance.patch(`/employees/${employee.id}/status`, { status: 'active', iin });
                } catch (e) { }

                return { success: true };
            }
            throw new Error("Invalid or expired invite token");
        }
    }
};
