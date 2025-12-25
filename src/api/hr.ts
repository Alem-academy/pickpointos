import axiosInstance from './client';
import type { Employee, Document } from '../services/api';

export const hrApi = {
    async getEmployees(filters?: { status?: string; pvzId?: string; search?: string }): Promise<Employee[]> {
        const res = await axiosInstance.get('/employees', { params: filters });
        return res.data;
    },

    async getEmployee(id: string): Promise<Employee> {
        const res = await axiosInstance.get(`/employees/${id}`);
        return res.data;
    },

    async createEmployee(data: Partial<Employee>): Promise<Employee> {
        const res = await axiosInstance.post('/employees', data);
        return res.data;
    },

    async updateEmployeeStatus(id: string, status: string): Promise<Employee> {
        const res = await axiosInstance.patch(`/employees/${id}/status`, { status });
        return res.data;
    },

    async getDocuments(employeeId: string): Promise<Document[]> {
        const res = await axiosInstance.get(`/employees/${employeeId}/documents`);
        return res.data;
    },

    async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
        const res = await axiosInstance.patch(`/employees/${id}/status`, data);
        return res.data;
    },

    async generateDocument(employeeId: string, type: string): Promise<{ document: Document; content: string }> {
        const res = await axiosInstance.post('/documents/generate', { employeeId, type });
        return res.data;
    },

    async transferEmployee(id: string, pvzId: string, date: string, comment: string): Promise<Employee> {
        const res = await axiosInstance.post(`/employees/${id}/transfer`, { pvzId, date, comment });
        return res.data;
    },

    async createDisciplineRecord(data: any): Promise<any> {
        const res = await axiosInstance.post('/discipline', data);
        return res.data;
    },

    async getDisciplineRecords(employeeId?: string): Promise<any[]> {
        const res = await axiosInstance.get('/discipline', { params: { employeeId } });
        return res.data;
    },

    async getBonuses(): Promise<any[]> {
        const res = await axiosInstance.get('/motivation/bonuses');
        return res.data;
    },

    async signDocument(id: string): Promise<Document> {
        const res = await axiosInstance.post(`/documents/${id}/sign`);
        return res.data;
    },
};
