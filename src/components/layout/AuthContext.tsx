import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@/types";
import { authService } from "@/services/auth";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Auth init failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email: string) => {
        // BYPASS LOGIN API
        // Immediately set user as logged in
        const mockUser: User = {
            id: '650e8400-e29b-41d4-a716-446655440000',
            email: email,
            role: 'admin', // Default generic role, actual permissions handled by UI state mostly
            name: 'Super Admin'
        };

        // Decide role based on input email for UI testing if needed, or just default to admin
        if (email.includes('hr')) mockUser.role = 'hr';
        if (email.includes('manager')) mockUser.role = 'rf';

        setUser(mockUser);
        localStorage.setItem('token', 'dev-bypass-token');
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
            localStorage.removeItem("user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
