import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// --- Helper Functions for Case Conversion ---

function toCamel(s: string): string {
    return s.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
}

function isObject(o: any): boolean {
    return o === Object(o) && !Array.isArray(o) && typeof o !== 'function';
}

function keysToCamel(o: any): any {
    if (isObject(o)) {
        const n: any = {};
        Object.keys(o).forEach((k) => {
            n[toCamel(k)] = keysToCamel(o[k]);
        });
        return n;
    } else if (Array.isArray(o)) {
        return o.map((i) => keysToCamel(i));
    }
    return o;
}

function toSnake(s: string): string {
    return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function keysToSnake(o: any): any {
    if (isObject(o)) {
        const n: any = {};
        Object.keys(o).forEach((k) => {
            n[toSnake(k)] = keysToSnake(o[k]);
        });
        return n;
    } else if (Array.isArray(o)) {
        return o.map((i) => keysToSnake(i));
    }
    return o;
}

// --- Interfaces (CamelCase for Frontend) ---

export interface PVZ {
    id: string;
    name: string;
    address: string;
    brand: string;
    areaSqm?: number;
    isActive: boolean;
}

export type EmployeeRole = 'admin' | 'hr' | 'rf' | 'employee';
export type EmployeeStatus = 'new' | 'review' | 'revision' | 'signing' | 'active' | 'fired';

export interface Document {
    id: string;
    employeeId: string;
    type: 'contract' | 'order_hiring' | 'order_firing' | 'order_transfer' | 'explanation' | 'other'
        | 'vacation_application' | 'vacation_order' | 'termination_order' | 'employment_certificate' | 'addendum'
        | '01_zayavlenie-o-vyhode-s-dekreta' | '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom'
        | '03_zayavlenie-ob-izmenenii-personalnyh-dannyh' | '04_prikaz-ob-otpuske-po-beremennosti-i-rodam'
        | '05_prikaz-o-prodlenii-otpuska-po-beremennosti' | '06_prikaz-o-vnesenii-izmeneniy-v-fio'
        | '07_prikaz-o-vyhode-iz-otpuska-po-uhodu' | '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu'
        | '09_zayavlenie-na-otpusk-po-beremennosti' | '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti'
        | '11_soglashenie-o-rastorzhenii-trudovogo-dogovora' | '12_dop-soglashenie-ob-izmenenii-familii';
    status: 'draft' | 'sent_to_employee' | 'signed' | 'rejected' | 'archived';
    scanUrl?: string;
    externalId?: string;
    createdAt: string;
    signedAt?: string;

    // eGov / SIGEX Integration
    egovOperationId?: string;
    egovStatus?: 'new' | 'meta' | 'data' | 'done' | 'canceled' | 'fail';
    egovLinks?: {
        mobile: string;
        business: string;
    };
    qrCode?: string; // Base64
    signers?: {
        iin: string;
        name: string;
        date: string;
    }[];
}

export interface Employee {
    id: string;
    iin: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    role: EmployeeRole;
    status: EmployeeStatus;

    // Relations
    mainPvzId: string | null;
    currentPvzId: string | null;
    mainPvzName?: string;

    // Financials
    baseRate?: number;
    probationUntil?: string;

    hiredAt: string | null;
    firedAt?: string | null;
    createdAt: string;
    position?: string; // Added to match mock
}

export interface Shift {
    id: string;
    shiftPlanId?: string;
    employeeId: string;
    pvzId: string;
    date: string;
    type: 'work' | 'vacation' | 'sick' | 'training';
    status: 'pending' | 'closed' | 'approved';
    plannedHours: number;
    factHours?: number;
    employeeName?: string;
}

export interface ExpenseRequest {
    id: string;
    pvzId: string;
    requesterId?: string;
    amount: number;
    category: 'supplies' | 'repairs' | 'marketing' | 'other' | 'office' | 'repair';
    description: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    createdAt: string;
    requesterName?: string;
}

export interface PayrollRecord {
    id: string;
    employeeId: string;
    month: string;
    totalShifts: number;
    totalHours: number;
    baseRate: number;
    totalAmount: number;
    status: 'calculated' | 'paid';
}

export interface PnLReport {
    revenue: number;
    opex: number;
    payroll: number;
    netProfit: number;
}

// --- API Client ---

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (options.body && typeof options.body === 'string') {
        // Assume body is already JSON stringified, but we need to ensure keys are snake_case
        // If the caller passed a string, we parse it, transform it, and stringify again.
        // Optimization: Callers should pass objects to a helper wrapper, but here we handle raw fetch calls.
        // Actually, let's just handle it in the methods below.
    }

    try {
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `API Error: ${res.statusText}`);
        }

        const data = await res.json();
        return keysToCamel(data);
    } catch (error) {
        console.error(`API Request failed for ${endpoint}:`, error);
        throw error;
    }
}

export const api = {
    async getPvzList(): Promise<PVZ[]> {
        return fetchApi<PVZ[]>('/pvz');
    },

    async getEmployees(filters?: { pvzId?: string; status?: string; search?: string }): Promise<Employee[]> {
        const params = new URLSearchParams();
        if (filters?.pvzId) params.append('pvzId', filters.pvzId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);

        return fetchApi<Employee[]>(`/employees?${params.toString()}`);
    },

    async getEmployee(id: string): Promise<Employee> {
        return fetchApi<Employee>(`/employees/${id}`);
    },

    async createEmployee(data: Partial<Employee>): Promise<Employee> {
        const snakeData = keysToSnake(data);
        return fetchApi<Employee>('/employees', {
            method: 'POST',
            body: JSON.stringify(snakeData),
        });
    },

    async updateEmployeeStatus(id: string, status: string): Promise<Employee> {
        return fetchApi<Employee>(`/employees/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    async getDocuments(employeeId: string): Promise<Document[]> {
        return fetchApi<Document[]>(`/employees/${employeeId}/documents`);
    },

    async generateDocument(employeeId: string, type: string, params?: Record<string, any>): Promise<{ document: Document; content: string }> {
        const body: any = { employeeId: employeeId, type };
        if (params) {
            body.params = params;
        }
        return fetchApi<{ document: Document; content: string }>('/documents/generate', {
            method: 'POST',
            body: JSON.stringify(body), // keysToSnake will handle employeeId -> employee_id
        });
    },

    async getTemplateSchema(type: string): Promise<{ templateName: string; fileName: string; type: string; required: string[]; variables: Record<string, any> }> {
        const data = await fetchApi<any>(`/templates/schemas/${type}`);
        return data.schema;
    },

    async getDocumentsStats(): Promise<{ pending: number }> {
        return fetchApi<{ pending: number }>('/documents/stats');
    },

    async transferEmployee(id: string, pvzId: string, date: string, comment: string): Promise<Employee> {
        return fetchApi<Employee>(`/employees/${id}/transfer`, {
            method: 'POST',
            body: JSON.stringify({ pvzId, date, comment }),
        });
    },

    async getTimesheet(month: string, pvzId?: string): Promise<any[]> {
        const params = new URLSearchParams({ month });
        if (pvzId) params.append('pvzId', pvzId);

        return fetchApi<any[]>(`/timesheets?${params.toString()}`);
    },

    async approveTimesheet(month: string, pvzId?: string): Promise<{ message: string }> {
        return fetchApi<{ message: string }>('/timesheets/approve', {
            method: 'POST',
            body: JSON.stringify({ month, pvzId }),
        });
    },

    async createDisciplineRecord(data: any): Promise<any> {
        return fetchApi<any>('/discipline', {
            method: 'POST',
            body: JSON.stringify(keysToSnake(data)),
        });
    },

    async getDisciplineRecords(employeeId?: string): Promise<any[]> {
        const params = new URLSearchParams();
        if (employeeId) params.append('employeeId', employeeId);

        return fetchApi<any[]>(`/discipline?${params.toString()}`);
    },

    async getBonuses(): Promise<any[]> {
        return fetchApi<any[]>('/motivation/bonuses');
    },

    async getRentOverview(): Promise<any[]> {
        return fetchApi<any[]>('/finance/rent');
    },

    async payRent(pvzId: string, month: string, amount: number): Promise<{ success: boolean }> {
        return fetchApi<{ success: boolean }>('/finance/rent/pay', {
            method: 'POST',
            body: JSON.stringify({ pvzId, month, amount }),
        });
    },

    async signDocument(id: string): Promise<Document> {
        return fetchApi<Document>(`/documents/${id}/sign`, {
            method: 'POST',
        });
    },

    async getShifts(pvzId?: string, start?: string, end?: string): Promise<Shift[]> {
        const params = new URLSearchParams();
        if (pvzId) params.append('pvzId', pvzId);
        if (start) params.append('start', start);
        if (end) params.append('end', end);

        return fetchApi<Shift[]>(`/shifts?${params.toString()}`);
    },

    async generateSchedule(data: { pvzId: string; teamA: string[]; teamB: string[]; startDate: string; endDate: string }): Promise<{ success: boolean; count: number }> {
        return fetchApi<{ success: boolean; count: number }>('/shifts/generate', {
            method: 'POST',
            body: JSON.stringify(keysToSnake(data)),
        });
    },

    async createShift(data: Partial<Shift>): Promise<Shift> {
        return fetchApi<Shift>('/shifts', {
            method: 'POST',
            body: JSON.stringify(keysToSnake(data)),
        });
    },

    async updateShift(id: string, data: Partial<Shift>): Promise<Shift> {
        return fetchApi<Shift>(`/shifts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(keysToSnake(data)),
        });
    },

    async deleteShift(id: string): Promise<{ message: string; id: string }> {
        return fetchApi<{ message: string; id: string }>(`/shifts/${id}`, {
            method: 'DELETE',
        });
    },

    async getExpenses(status?: string): Promise<ExpenseRequest[]> {
        const params = new URLSearchParams();
        if (status) params.append('status', status);

        return fetchApi<ExpenseRequest[]>(`/finance/expenses?${params.toString()}`);
    },

    async createExpense(data: { pvzId: string; amount: number; category: string; description: string }): Promise<ExpenseRequest> {
        return fetchApi<ExpenseRequest>('/finance/expenses', {
            method: 'POST',
            body: JSON.stringify(keysToSnake(data)),
        });
    },

    async updateExpenseStatus(id: string, status: 'approved' | 'rejected'): Promise<ExpenseRequest> {
        return fetchApi<ExpenseRequest>(`/finance/expenses/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    async calculatePayroll(data: { pvzId: string; month: string }): Promise<PayrollRecord[]> {
        return fetchApi<PayrollRecord[]>('/payroll/calculate', {
            method: 'POST',
            body: JSON.stringify(keysToSnake(data)),
        });
    },

    async getPnL(pvzId: string, month: string): Promise<PnLReport> {
        const params = new URLSearchParams({ pvzId, month });
        return fetchApi<PnLReport>(`/reports/pnl?${params.toString()}`);
    },

    async createPvz(data: { name: string; address: string; brand: string; area: number }): Promise<PVZ> {
        return fetchApi<PVZ>('/pvz/new', {
            method: 'POST',
            body: JSON.stringify(keysToSnake(data)),
        });
    },

    async getPvzChecklist(pvzId: string): Promise<any[]> {
        return fetchApi<any[]>(`/pvz/checklist/${pvzId}`);
    },

    async updateChecklistItem(pvzId: string, itemId: string, status: string): Promise<any> {
        return fetchApi<any>(`/pvz/checklist/${pvzId}/item/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    async getAnalyticsDashboard(month?: string): Promise<any> {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        return fetchApi<any>(`/analytics/dashboard?${params.toString()}`);
    }
};
