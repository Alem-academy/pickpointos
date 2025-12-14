import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    FileText,
    UserPlus,
    Building2,
    LogOut
} from "lucide-react";

export function Sidebar() {
    const { user, logout } = useAuth();

    if (!user) return null;

    const hrLinks = [
        { to: "/hr", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/hr/applications", icon: FileText, label: "Applications" },
        { to: "/hr/employees", icon: Users, label: "Employees" },
    ];

    const rfLinks = [
        { to: "/rf", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/rf/new-hire", icon: UserPlus, label: "New Hire" },
        { to: "/rf/my-point", icon: Building2, label: "My Point" },
    ];

    const links = user.role === "admin"
        ? [...hrLinks, ...rfLinks]
        : user.role === "hr" ? hrLinks : rfLinks;

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-xl font-bold tracking-tight text-primary">PVZ OS</span>
            </div>

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

            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.role.toUpperCase()}</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}
