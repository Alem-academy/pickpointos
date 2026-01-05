// Axios instance moved to src/api/client.ts

// Types from original file
export interface PVZ {
    id: string;
    name: string;
    address: string;
    brand: string;
    area_sqm?: number;
    is_active: boolean;
}

export type EmployeeRole = 'admin' | 'hr' | 'rf' | 'employee' | 'financier';
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
    onboarding_checklist?: Record<string, boolean>;
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
    breakdown?: {
        opex: Array<{ category: string; amount: number }>;
    };
}

// API Methods Wrapper (keeping backward compatibility with "api.method" style)
import axiosInstance from '../api/client';
import { hrApi } from '../api/hr';
import { financeApi } from '../api/finance';
import { operationsApi } from '../api/operations';
import { analyticsApi } from '../api/analytics';

// Re-export axios instance
export default axiosInstance;

// API Methods Wrapper (delegating to new modules)
export const api = {
    ...hrApi,
    ...financeApi,
    ...operationsApi,
    ...analyticsApi,
};

// Axios Instance (default export for auth service)
// End of file
