import { useState } from "react";
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
import { MobileProfileSheet } from "./MobileProfileSheet";

export function MobileNav() {
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    if (!user) return null;

    const getMobileLinks = () => {
        // Courier gets a very specific, simplified bottom nav
        if (user.role === 'employee' || user.role === 'courier' as any) {
            return [
                { id: "home", to: "/courier", icon: Home, label: "Смена", end: true },
                { id: "schedule", to: "/operations/schedule", icon: Calendar, label: "График" },
                { id: "earnings", to: "#earnings", icon: CreditCard, label: "Доход" },
                { id: "profile", to: "#profile", icon: User, label: "Профиль" },
            ];
        }

        // RF Managers get operations focus
        if (user.role === 'rf') {
            return [
                { id: "home", to: "/rf", icon: Home, label: "Дашборд", end: true },
                { id: "point", to: "/rf/my-point", icon: Clock, label: "ПВЗ" },
                { id: "schedule", to: "/operations/schedule", icon: Calendar, label: "График" },
                { id: "profile", to: "#profile", icon: User, label: "Профиль" },
            ];
        }

        // Default / Fallback for HR/Finance on mobile (though they mostly use desktop)
        const defaultHome = user.role === 'hr' ? '/hr' : user.role === 'financier' ? '/finance' : '/';
        return [
            { id: "home", to: defaultHome, icon: Home, label: "Главная", end: true },
            { id: "schedule", to: "/operations/schedule", icon: Calendar, label: "Календарь" },
            { id: "profile", to: "#profile", icon: User, label: "Меню" }
        ];
    };

    const links = getMobileLinks();

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <nav className="flex h-[60px] items-center justify-around">
                    {links.map((link) => {
                        const isProfileBtn = link.id === 'profile';

                        if (isProfileBtn) {
                            return (
                                <button
                                    key={link.id}
                                    onClick={() => setIsProfileOpen(true)}
                                    className="flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 text-muted-foreground/70 hover:text-foreground"
                                >
                                    <div className="p-1.5 rounded-xl transition-colors">
                                        <link.icon className="h-5 w-5" strokeWidth={2.5} />
                                    </div>
                                    <span className="mt-0.5">{link.label}</span>
                                </button>
                            );
                        }

                        return (
                            <NavLink
                                key={link.id}
                                to={link.to}
                                end={link.end}
                                onClick={(e) => {
                                    if (link.to.startsWith('#')) e.preventDefault();
                                }}
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
                                    (({ isActive }: any) => isActive && !link.to.startsWith('#') ? "bg-primary/10" : "")
                                )}>
                                    <link.icon className="h-5 w-5" strokeWidth={2.5} />
                                </div>
                                <span className="mt-0.5">{link.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <MobileProfileSheet
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </>
    );
}
