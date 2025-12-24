import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
        }
    }
    return config;
});

// Types from original file
export interface PVZ {
    id: string;
    name: string;
    address: string;
    brand: string;
    area_sqm?: number;
    is_active: boolean;
}

export type EmployeeRole = 'admin' | 'hr' | 'rf' | 'employee';
export type EmployeeStatus = 'new' | 'review' | 'revision' | 'signing' | 'active' | 'fired';

export interface Document {
    id: string;
    employee_id: string;
    type: 'contract' | 'order' | 'id_scan' | 'other';
    status: 'draft' | 'sent_to_employee' | 'signed' | 'rejected' | 'archived';
    scan_url?: string;
    created_at: string;
    signed_at?: string;
    egov_operation_id?: string;
    egov_status?: 'new' | 'meta' | 'data' | 'done' | 'canceled' | 'fail';
    signers?: { iin: string; name: string; date: string }[];
}

export interface Employee {
    id: string;
    iin: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    role: EmployeeRole;
    status: EmployeeStatus;
    main_pvz_id: string | null;
    current_pvz_id: string | null;
    main_pvz_name?: string;
    main_pvz_address?: string;
    base_rate?: number;
    probation_until?: string;
    address?: string;
    hired_at: string | null;
    created_at: string;
    iban?: string; // KZ IBAN
}

export interface Shift {
    id: string;
    employee_id: string;
    pvz_id: string;
    date: string;
    type: 'scheduled' | 'extra';
    status: 'pending' | 'open' | 'closed' | 'absence' | 'rejected';
    planned_hours: number;
    fact_hours?: number;
    employee_name?: string;
}

export interface ExpenseRequest {
    id: string;
    pvz_id: string;
    requester_id: string;
    amount: number;
    category: 'supplies' | 'repairs' | 'marketing' | 'other';
    description: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    created_at: string;
    requester_name?: string;
}

export interface PayrollRecord {
    id: string;
    employee_id: string;
    month: string;
    total_hours: number;
    rate: number;
    total_amount: number;
    status: 'calculated' | 'paid';
}

export interface PnLReport {
    revenue: number;
    opex: number;
    payroll: number;
    netProfit: number;
}

// API Methods Wrapper (keeping backward compatibility with "api.method" style)
export const api = {
    async getPvzList(): Promise<PVZ[]> {
        const res = await axiosInstance.get('/pvz');
        return res.data;
    },

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

    async generateDocument(employeeId: string, type: string): Promise<{ document: Document; content: string }> {
        const res = await axiosInstance.post('/documents/generate', { employeeId, type });
        return res.data;
    },

    async transferEmployee(id: string, pvzId: string, date: string, comment: string): Promise<Employee> {
        const res = await axiosInstance.post(`/employees/${id}/transfer`, { pvzId, date, comment });
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

    async signDocument(id: string): Promise<Document> {
        const res = await axiosInstance.post(`/documents/${id}/sign`);
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

    async calculatePayroll(data: { pvzId: string; month: string }): Promise<PayrollRecord[]> {
        const res = await axiosInstance.post('/finance/payroll/calculate', data);
        return res.data;
    },

    async getPnL(pvzId: string, month: string): Promise<PnLReport> {
        const res = await axiosInstance.get('/finance/pnl', { params: { pvzId, month } });
        return res.data;
    },

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

    async triggerParser(sheetId?: string): Promise<{ message: string; stats: any }> {
        const res = await axiosInstance.post('/parse', { sheetId });
        return res.data;
    },
};

// Axios Instance (default export for auth service)
export default axiosInstance;
