import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/layout/AuthContext";
import { LayoutDashboard, Users, Loader2, ShieldCheck, Wallet, FileKey, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SigexService } from "@/services/sigex";
// @ts-ignore
import { NCALayerClient } from 'ncalayer-js-client';

interface RoleButtonProps {
    role: 'admin' | 'hr' | 'rf' | 'finance';
    icon: any;
    label: string;
    desc: string;
    // Removed colorClass for conservative design
    isLoading: boolean;
    selectedRole: string | null;
    onClick: (role: 'admin' | 'hr' | 'rf' | 'finance') => void;
}

const RoleButton = ({ role, icon: Icon, label, desc, isLoading, selectedRole, onClick }: RoleButtonProps) => (
    <button
        onClick={() => onClick(role)}
        disabled={isLoading}
        className={cn(
            "group relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-slate-400 hover:bg-slate-50",
            isLoading && "opacity-50 cursor-not-allowed",
            selectedRole === role ? "border-slate-900 ring-1 ring-slate-900" : ""
        )}
    >
        <div className={cn(
            "rounded-lg p-2.5 bg-slate-100 text-slate-700 transition-colors group-hover:bg-white group-hover:text-slate-900",
            selectedRole === role && "bg-slate-900 text-white group-hover:bg-slate-900 group-hover:text-white"
        )}>
            <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-slate-900">{label}</h3>
            <p className="text-xs text-slate-500 truncate">{desc}</p>
        </div>
        {isLoading && selectedRole === role ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
        ) : (
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
        )}
    </button>
);

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'hr' | 'rf' | 'finance' | null>(null);

    const handleLogin = async (role: 'admin' | 'hr' | 'rf' | 'finance') => {
        setSelectedRole(role);
        setIsLoading(true);
        try {
            let email = '';
            switch (role) {
                case 'admin': email = 'admin@pvz.kz'; break;
                case 'hr': email = 'aigul.kasymova@pvz.kz'; break;
                case 'rf': email = 'aidar.bekbolatov@pvz.kz'; break;
                case 'finance': email = 'admin@pvz.kz'; break;
            }

            if (role === 'finance') email = 'admin@pvz.kz';

            await login({ email, password: 'password123' });

            const target = location.state?.from?.pathname || (role === 'rf' ? '/rf' : '/hr');
            navigate(target, { replace: true });
        } catch (error: any) {
            console.error("Login failed", error);
            const errorMessage = error.response?.data?.error || error.message || "Неизвестная ошибка";
            alert(`Ошибка входа: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setSelectedRole(null);
        }
    };

    const handleEdsLogin = async () => {
        setIsLoading(true);
        try {
            const { nonce } = await SigexService.getAuthNonce();
            const ncalayer = new NCALayerClient();
            await ncalayer.connect();

            let signature;
            try {
                signature = await ncalayer.createCmsSignature(nonce);
            } catch (e) {
                console.error("NCALayer signing failed", e);
                alert("Ошибка подписи. Проверьте запуск NCALayer.");
                setIsLoading(false);
                return;
            }

            if (!signature) {
                alert("Подпись не получена.");
                setIsLoading(false);
                return;
            }

            await SigexService.authenticate(signature);
            await login({ email: 'eds_user@example.com', password: 'password123' });
            navigate('/hr', { replace: true });
        } catch (error) {
            console.error("EDS Login failed", error);
            alert("Ошибка входа по ЭЦП");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
            <div className="w-full max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        PVZ OS <span className="text-slate-300 font-medium text-lg ml-1">v2.0</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        Выберите роль для входа в систему
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <RoleButton
                        role="hr"
                        icon={Users}
                        label="HR Менеджер"
                        desc="Кадры и найм" // Shortened description
                        isLoading={isLoading}
                        selectedRole={selectedRole}
                        onClick={handleLogin}
                    />
                    <RoleButton
                        role="rf"
                        icon={LayoutDashboard}
                        label="Управляющий"
                        desc="Точки и смены"
                        isLoading={isLoading}
                        selectedRole={selectedRole}
                        onClick={handleLogin}
                    />
                    <RoleButton
                        role="finance"
                        icon={Wallet}
                        label="Финансист"
                        desc="Отчеты и P&L"
                        isLoading={isLoading}
                        selectedRole={selectedRole}
                        onClick={handleLogin}
                    />
                    <RoleButton
                        role="admin"
                        icon={ShieldCheck}
                        label="Админ"
                        desc="Все доступы"
                        isLoading={isLoading}
                        selectedRole={selectedRole}
                        onClick={handleLogin}
                    />
                </div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                        <span className="bg-white px-2 text-slate-400 font-bold">Альтернатива</span>
                    </div>
                </div>

                <button
                    onClick={handleEdsLogin}
                    disabled={isLoading}
                    className={cn(
                        "group flex w-full items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 p-3 text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileKey className="h-4 w-4" />
                    )}
                    <span className="font-bold text-sm">Войти с ЭЦП</span>
                </button>

                <p className="text-center text-xs font-medium text-slate-300 pt-2">
                    &copy; 2025 Alem Lab. Protected System.
                </p>
            </div>
        </div>
    );
}
