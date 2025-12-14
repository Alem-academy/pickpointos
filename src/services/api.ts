const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
    type: 'contract' | 'order_hiring' | 'order_firing' | 'order_transfer' | 'explanation' | 'other';
    status: 'draft' | 'sent_to_employee' | 'signed' | 'rejected' | 'archived';
    scan_url?: string;
    external_id?: string;
    created_at: string;
    signed_at?: string;

    // eGov / SIGEX Integration
    egov_operation_id?: string;
    egov_status?: 'new' | 'meta' | 'data' | 'done' | 'canceled' | 'fail';
    egov_links?: {
        mobile: string;
        business: string;
    };
    qr_code?: string; // Base64
    signers?: {
        iin: string;
        name: string;
        date: string;
    }[];
}

export interface Employee {
    id: string;
    iin: string; // Unique ID
    full_name: string;
    email: string | null;
    phone: string | null;
    role: EmployeeRole;
    status: EmployeeStatus;

    // Relations
    main_pvz_id: string | null;
    current_pvz_id: string | null;
    main_pvz_name?: string; // Joined field
    main_pvz_address?: string; // Joined field

    // Financials
    base_rate?: number;
    probation_until?: string;
    address?: string; // Residential address

    hired_at: string | null;
    created_at: string;
}

export interface Shift {
    id: string;
    shift_plan_id: string;
    employee_id: string;
    pvz_id: string;
    date: string;
    type: 'work' | 'vacation' | 'sick' | 'training';
    status: 'pending' | 'closed';
    planned_hours: number;
    fact_hours?: number;
    employee_name?: string; // Joined field
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
    total_shifts: number;
    total_hours: number;
    base_rate: number;
    total_amount: number;
    status: 'calculated' | 'paid';
}

export interface PnLReport {
    revenue: number;
    opex: number;
    payroll: number;
    netProfit: number;
}

export const api = {
    async getPvzList(): Promise<PVZ[]> {
        const res = await fetch(`${API_URL}/pvz`);
        if (!res.ok) throw new Error('Failed to fetch PVZ list');
        return res.json();
    },

    async getEmployees(filters?: { status?: string; pvzId?: string; search?: string }): Promise<Employee[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.pvzId) params.append('pvzId', filters.pvzId);
        if (filters?.search) params.append('search', filters.search);

        const res = await fetch(`${API_URL}/employees?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch employees');
        return res.json();
    },

    async getEmployee(id: string): Promise<Employee> {
        const res = await fetch(`${API_URL}/employees/${id}`);
        if (!res.ok) throw new Error('Failed to fetch employee');
        return res.json();
    },

    async createEmployee(data: Partial<Employee>): Promise<Employee> {
        const res = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create employee');
        return res.json();
    },

    async updateEmployeeStatus(id: string, status: string): Promise<Employee> {
        const res = await fetch(`${API_URL}/employees/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update employee status');
        return res.json();
    },

    async getDocuments(employeeId: string): Promise<Document[]> {
        const res = await fetch(`${API_URL}/employees/${employeeId}/documents`);
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
    },

    async generateDocument(employeeId: string, type: string): Promise<{ document: Document; content: string }> {
        const res = await fetch(`${API_URL}/documents/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, type }),
        });
        if (!res.ok) throw new Error('Failed to generate document');
        return res.json();
    },

    async transferEmployee(id: string, pvzId: string, date: string, comment: string): Promise<Employee> {
        const res = await fetch(`${API_URL}/employees/${id}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pvzId, date, comment }),
        });
        if (!res.ok) throw new Error('Failed to transfer employee');
        return res.json();
    },

    async getTimesheet(month: string, pvzId?: string): Promise<any[]> {
        const params = new URLSearchParams({ month });
        if (pvzId) params.append('pvzId', pvzId);

        const res = await fetch(`${API_URL}/timesheets?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch timesheet');
        return res.json();
    },

    async approveTimesheet(month: string, pvzId?: string): Promise<{ message: string }> {
        const res = await fetch(`${API_URL}/timesheets/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, pvzId }),
        });
        if (!res.ok) throw new Error('Failed to approve timesheet');
        return res.json();
    },

    async createDisciplineRecord(data: any): Promise<any> {
        const res = await fetch(`${API_URL}/discipline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create discipline record');
        return res.json();
    },

    async getDisciplineRecords(employeeId?: string): Promise<any[]> {
        const params = new URLSearchParams();
        if (employeeId) params.append('employeeId', employeeId);

        const res = await fetch(`${API_URL}/discipline?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch discipline records');
        return res.json();
    },

    async getBonuses(): Promise<any[]> {
        const res = await fetch(`${API_URL}/motivation/bonuses`);
        if (!res.ok) throw new Error('Failed to fetch bonuses');
        return res.json();
    },

    async getRentOverview(): Promise<any[]> {
        const res = await fetch(`${API_URL}/finance/rent`);
        if (!res.ok) throw new Error('Failed to fetch rent overview');
        return res.json();
    },

    async payRent(pvzId: string, month: string, amount: number): Promise<{ success: boolean }> {
        const res = await fetch(`${API_URL}/finance/rent/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pvzId, month, amount }),
        });
        if (!res.ok) throw new Error('Failed to pay rent');
        return res.json();
    },

    async signDocument(id: string): Promise<Document> {
        const res = await fetch(`${API_URL}/documents/${id}/sign`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to sign document');
        return res.json();
    },

    async getShifts(pvzId?: string, start?: string, end?: string): Promise<Shift[]> {
        const params = new URLSearchParams();
        if (pvzId) params.append('pvzId', pvzId);
        if (start) params.append('start', start);
        if (end) params.append('end', end);

        const res = await fetch(`${API_URL}/shifts?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch shifts');
        return res.json();
    },

    async generateSchedule(data: { pvzId: string; teamA: string[]; teamB: string[]; startDate: string; endDate: string }): Promise<{ success: boolean; count: number }> {
        const res = await fetch(`${API_URL}/shifts/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to generate schedule');
        return res.json();
    },

    async createShift(data: Partial<Shift>): Promise<Shift> {
        const res = await fetch(`${API_URL}/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create shift');
        return res.json();
    },

    async updateShift(id: string, data: Partial<Shift>): Promise<Shift> {
        const res = await fetch(`${API_URL}/shifts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update shift');
        return res.json();
    },

    async deleteShift(id: string): Promise<{ message: string; id: string }> {
        const res = await fetch(`${API_URL}/shifts/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete shift');
        return res.json();
    },

    async getExpenses(status?: string): Promise<ExpenseRequest[]> {
        const params = new URLSearchParams();
        if (status) params.append('status', status);

        const res = await fetch(`${API_URL}/finance/expenses?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch expenses');
        return res.json();
    },

    async createExpense(data: { pvzId: string; amount: number; category: string; description: string }): Promise<ExpenseRequest> {
        const res = await fetch(`${API_URL}/finance/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create expense request');
        return res.json();
    },

    async updateExpenseStatus(id: string, status: 'approved' | 'rejected'): Promise<ExpenseRequest> {
        const res = await fetch(`${API_URL}/finance/expenses/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update expense status');
        return res.json();
    },

    async calculatePayroll(data: { pvzId: string; month: string }): Promise<PayrollRecord[]> {
        const res = await fetch(`${API_URL}/payroll/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to calculate payroll');
        return res.json();
    },

    async getPnL(pvzId: string, month: string): Promise<PnLReport> {
        const params = new URLSearchParams({ pvzId, month });
        const res = await fetch(`${API_URL}/reports/pnl?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch P&L');
        return res.json();
    },

    async createPvz(data: { name: string; address: string; brand: string; area: number }): Promise<PVZ> {
        const res = await fetch(`${API_URL}/pvz/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create PVZ');
        return res.json();
    },

    async getPvzChecklist(pvzId: string): Promise<any[]> {
        const res = await fetch(`${API_URL}/pvz/checklist/${pvzId}`);
        if (!res.ok) throw new Error('Failed to fetch checklist');
        return res.json();
    },

    async updateChecklistItem(pvzId: string, itemId: string, status: string): Promise<any> {
        const res = await fetch(`${API_URL}/pvz/checklist/${pvzId}/item/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update checklist item');
        return res.json();
    },

    async getAnalyticsDashboard(month?: string): Promise<any> {
        const params = new URLSearchParams();
        if (month) params.append('month', month);

        const res = await fetch(`${API_URL}/analytics/dashboard?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
    }
};

