import type { User } from "@/types";

const MOCK_USERS: User[] = [
    {
        id: "user-hr-1",
        email: "hr@example.com",
        name: "Elena HR",
        role: "hr",
    },
    {
        id: "user-rf-1",
        email: "manager@example.com",
        name: "Ivan Manager",
        role: "rf",
    },
    {
        id: "user-admin-1",
        email: "admin@example.com",
        name: "Super Admin",
        role: "admin",
    },
];

export const authService = {
    login: async (email: string): Promise<User> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const user = MOCK_USERS.find((u) => u.email === email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        return user;
    },

    logout: async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
    },

    getCurrentUser: async (): Promise<User | null> => {
        // In a real app, this would check a token or session
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    },
};
