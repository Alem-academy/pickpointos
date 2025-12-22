import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    FileText,
    UserPlus,
    Building2,
    BarChart3,
    Calendar,
    Clock,
    Receipt,
    LogOut,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarLink {
    to: string;
    icon: any;
    label: string;
    end?: boolean;
}

export function Sidebar() {
    const { user, logout } = useAuth();

    // 1. Safe Access: Use a derived state or safe constants
    // If user is null (shouldn't happen in Sidebar due to Layout check, but good for safety), fail gracefully.
    if (!user) {
        return (
            <div className="flex h-screen w-64 flex-col border-r bg-card p-4">
                <div className="flex items-center gap-2 text-amber-600">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-sm font-bold">Ошибка сессии</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Данные отсутствуют. Войдите снова.</p>
                <Button onClick={() => logout()} variant="outline" size="sm" className="mt-4">
                    На главную
                </Button>
            </div>
        );
    }

    // 2. Role-Based Link Logic
    const getLinks = (role: string = 'guest'): SidebarLink[] => {
        const hrLinks: SidebarLink[] = [
            { to: "/hr", icon: LayoutDashboard, label: "Дашборд", end: true },
            { to: "/hr/applications", icon: FileText, label: "Заявки" },
            { to: "/hr/employees", icon: Users, label: "Сотрудники" },
        ];

        const rfLinks: SidebarLink[] = [
            { to: "/rf", icon: LayoutDashboard, label: "Дашборд", end: true },
            { to: "/rf/new-hire", icon: UserPlus, label: "Нанять" },
            { to: "/rf/my-point", icon: Building2, label: "Мой ПВЗ" },
        ];

        const opsLinks: SidebarLink[] = [
            { to: "/operations/schedule", icon: Calendar, label: "График" },
            { to: "/operations/timesheets", icon: Clock, label: "Табели" },
            { to: "/finance/expenses", icon: Receipt, label: "Расходы" },
            { to: "/analytics/dashboard", icon: BarChart3, label: "Аналитика" },
        ];

        if (role === 'admin') return [...hrLinks, ...opsLinks, ...rfLinks];
        if (role === 'hr') return hrLinks;
        if (role === 'rf') return rfLinks;
        return []; // Guest/Unknown
    };

    const links = getLinks(user.role);

    // 3. User Avatar Logic (Safe)
    const initials = user.name
        ? user.name.charAt(0).toUpperCase()
        : user.email
            ? user.email.charAt(0).toUpperCase()
            : '?';

    const displayName = user.name || user.email || 'Неизвестный';
    const displayRole = user.role ? user.role.toUpperCase() : 'ГОСТЬ';

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center border-b px-6">
                <span className="text-xl font-bold tracking-tight text-primary">PVZ OS</span>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Footer / User Profile */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 min-w-[2rem] rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {initials}
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                        <p className="truncate text-sm font-medium" title={displayName}>
                            {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {displayRole}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Выйти
                </button>
            </div>
        </div>
    );
}
