import React from "react";
import { X, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/layout/AuthContext";

interface MobileProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileProfileSheet({ isOpen, onClose }: MobileProfileSheetProps) {
    const { user, logout } = useAuth();
    const sheetRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [isOpen]);

    if (!user) return null;

    const displayName = user.name || user.email || 'Сотрудник';
    const initials = displayName.charAt(0).toUpperCase();

    const handleLogout = () => {
        onClose();
        logout();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-[70] flex flex-col rounded-t-[2rem] bg-background p-6 transition-transform duration-300 ease-out md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-muted" />

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold">Профиль</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                        {initials}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-base font-bold text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">{user.role}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        className="flex w-full items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4 text-left font-semibold text-slate-700 active:scale-95 transition-all"
                    >
                        <UserIcon className="h-5 w-5 text-slate-400" />
                        Личные данные
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-left font-bold text-red-600 active:scale-95 transition-all"
                    >
                        <LogOut className="h-5 w-5 text-red-500" />
                        Выйти из аккаунта
                    </button>
                </div>

                {/* Safe area spacer */}
                <div className="h-4 pb-safe" />
            </div>
        </>
    );
}
