import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { UserSchema, type User, type LoginCredentials } from "@/types/auth";
import { authService } from "@/services/auth";

interface AuthContextType {
    user: User | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                const validatedUser = UserSchema.parse(parsed);
                setUser(validatedUser);
            }
        } catch (error) {
            console.warn("Auth restoration failed:", error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            // Call actual auth service
            const response = await authService.login(credentials.email, credentials.password);

            // Validate response against our strict schema
            const validatedUser = UserSchema.parse(response);

            localStorage.setItem('user', JSON.stringify(validatedUser));
            if (validatedUser.token) {
                localStorage.setItem('token', validatedUser.token);
            }
            setUser(validatedUser);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
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
