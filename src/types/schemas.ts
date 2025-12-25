import { z } from 'zod';

export const EmployeeSchema = z.object({
    id: z.string(),
    full_name: z.string(),
    role: z.string(),
    status: z.string(),
    base_rate: z.number(),
    main_pvz_id: z.string().nullable().optional(),
    main_pvz_name: z.string().nullable().optional(),
    hired_at: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    password_hash: z.string().optional(),
    onboarding_checklist: z.record(z.string(), z.boolean()).optional().default({}),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const HRStatsSchema = z.object({
    totalEmployees: z.number(),
    newHiresThisMonth: z.number(),
    pendingApplications: z.number(),
    recentActivity: z.array(z.object({
        id: z.string(),
        full_name: z.string(),
        role: z.string(),
        hired_at: z.string(),
    })).optional().default([]),
});

export type HRStats = z.infer<typeof HRStatsSchema>;

export const RFStatsSchema = z.object({
    pvz: z.object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
        brand: z.string().optional(),
    }).nullable().optional(),
    todayShift: z.array(z.object({
        id: z.string(),
        full_name: z.string(),
        role: z.string(),
    })).optional().default([]),
    monthlyApprovedExpenses: z.number().or(z.string()), // Backend might send string formatted money
});

export type RFStats = z.infer<typeof RFStatsSchema>;

export const ExpenseRequestSchema = z.object({
    id: z.string(),
    pvz_id: z.string(),
    requester_id: z.string(),
    amount: z.number(),
    category: z.string(), // 'supplies' | 'repairs' | 'marketing' | 'other'
    description: z.string(),
    status: z.enum(['pending', 'approved', 'rejected', 'paid']),
    created_at: z.string(),
    requester_name: z.string().optional(),
    pvz_name: z.string().optional(),
});

export type ExpenseRequest = z.infer<typeof ExpenseRequestSchema>;

export const PnLReportSchema = z.object({
    revenue: z.number(),
    opex: z.number(),
    payroll: z.number(),
    netProfit: z.number(),
});

export type PnLReport = z.infer<typeof PnLReportSchema>;
