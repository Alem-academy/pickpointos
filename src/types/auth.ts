import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'hr', 'rf', 'employee', 'guest', 'financier']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(), // Normalized from full_name
    role: UserRoleSchema,
    pvz_id: z.string().optional().nullable(),
    token: z.string().optional(), // For our mock auth
});

export type User = z.infer<typeof UserSchema>;

export const LoginCredentialsSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
