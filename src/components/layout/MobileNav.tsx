import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { cn } from "@/lib/utils";
import {
    Home,
    Calendar,
    User,
    Clock,
    CreditCard
} from "lucide-react";

export function MobileNav() {
    const { user } = useAuth();

    if (!user) return null;

    const getMobileLinks = () => {
        // Courier gets a very specific, simplified bottom nav
        if (user.role === 'employee' || user.role === 'courier' as any) {
            return [
                { to: "/courier", icon: Home, label: "Смена", end: true },
                { to: "/operations/schedule", icon: Calendar, label: "График" },
                { to: "#earnings", icon: CreditCard, label: "Доход" },
                { to: "#profile", icon: User, label: "Профиль" },
            ];
        }

        // RF Managers get operations focus
        if (user.role === 'rf') {
            return [
                { to: "/rf", icon: Home, label: "Дашборд", end: true },
                { to: "/rf/my-point", icon: Clock, label: "ПВЗ" },
                { to: "/operations/schedule", icon: Calendar, label: "График" },
                { to: "#profile", icon: User, label: "Профиль" },
            ];
        }

        // Default / Fallback for HR/Finance on mobile (though they mostly use desktop)
        const defaultHome = user.role === 'hr' ? '/hr' : user.role === 'financier' ? '/finance' : '/';
        return [
            { to: defaultHome, icon: Home, label: "Главная", end: true },
            { to: "/operations/schedule", icon: Calendar, label: "Календарь" },
            { to: "#profile", icon: User, label: "Меню" }
        ];
    };

    const links = getMobileLinks();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <nav className="flex h-[60px] items-center justify-around">
                {links.map((link) => (
                    <NavLink
                        key={link.label}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                                isActive && !link.to.startsWith('#')
                                    ? "text-primary scale-110"
                                    : "text-muted-foreground/70 hover:text-foreground"
                            )
                        }
                    >
                        <div className={cn(
                            "p-1.5 rounded-xl transition-colors",
                            // Add a subtle background to the active icon
                            (({ isActive }: any) => isActive && !link.to.startsWith('#') ? "bg-primary/10" : "")
                        )}>
                            <link.icon className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                        <span className="mt-0.5">{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
