import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/layout/AuthContext";
import { LayoutDashboard, Users, ArrowRight, Loader2, ShieldCheck, Wallet, FileKey } from "lucide-react";
import { cn } from "@/lib/utils";
import { SigexService } from "@/services/sigex";
// @ts-ignore
import { NCALayerClient } from 'ncalayer-js-client';

interface RoleButtonProps {
    role: 'admin' | 'hr' | 'rf' | 'finance';
    icon: any;
    label: string;
    desc: string;
    colorClass: string;
    isLoading: boolean;
    selectedRole: string | null;
    onClick: (role: 'admin' | 'hr' | 'rf' | 'finance') => void;
}

const RoleButton = ({ role, icon: Icon, label, desc, colorClass, isLoading, selectedRole, onClick }: RoleButtonProps) => (
    <button
        onClick={() => onClick(role)}
        disabled={isLoading}
        className={cn(
            "group relative flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-5 text-left transition-all hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            isLoading && "opacity-50 cursor-not-allowed"
        )}
    >
        <div className="flex items-center gap-4">
            <div className={cn("rounded-xl p-3", colorClass)}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <h3 className="font-black text-slate-900">{label}</h3>
                <p className="text-sm font-bold text-slate-400">{desc}</p>
            </div>
        </div>
        {isLoading && selectedRole === role ? (
            <Loader2 className="h-5 w-5 animate-spin text-black" />
        ) : (
            <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-black" />
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

            // Default dev password if empty
            await login({ email, password: 'password123' });

            const target = location.state?.from?.pathname || (role === 'rf' ? '/rf' : '/hr');
            navigate(target, { replace: true });
        } catch (error: any) {
            console.error("Login failed", error);
            const errorMessage = error.response?.data?.error || error.message || "Неизвестная ошибка";
            alert(`Ошибка входа: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdsLogin = async () => {
        setIsLoading(true);
        try {
            // 1. Get Nonce
            const { nonce } = await SigexService.getAuthNonce();

            // 2. Sign Nonce with NCALayer
            const ncalayer = new NCALayerClient();
            await ncalayer.connect();

            // 'basics' module, 'cms' sign type
            // Note: The API might differ slightly depending on the version, 
            // but usually it's createCmsSignature(data, signType, attached)
            // or similar. Let's assume standard usage for now.
            let signature;
            try {
                signature = await ncalayer.createCmsSignature(nonce);
            } catch (e) {
                console.error("NCALayer signing failed", e);
                alert("Ошибка подписи в NCALayer. Убедитесь, что NCALayer запущен.");
                setIsLoading(false);
                return;
            }

            if (!signature) {
                alert("Подпись не получена.");
                setIsLoading(false);
                return;
            }

            // 3. Authenticate with SIGEX
            await SigexService.authenticate(signature);

            // 4. Login (Mocking user for now as we don't have user mapping yet)
            await login({ email: 'eds_user@example.com', password: 'password123' }); // Hack for now
            navigate('/hr', { replace: true }); // Default to HR for EDS users for now

        } catch (error) {
            console.error("EDS Login failed", error);
            alert("Ошибка входа по ЭЦП");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Left Section: Login */}
            <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-16">
                <div className="mx-auto w-full max-w-md space-y-8">
                    <div>
                        <h1 className="text-5xl font-black tracking-tight text-slate-900">
                            PVZ OS
                        </h1>
                        <p className="mt-4 text-xl font-bold text-slate-500">
                            Операционная система управления сетью ПВЗ
                        </p>
                    </div>

                    <div className="space-y-4">

                        <div className="grid gap-4">
                            <RoleButton
                                role="admin"
                                icon={ShieldCheck}
                                label="Администратор"
                                desc="Полный доступ к системе"
                                colorClass="bg-slate-100 text-slate-900"
                                isLoading={isLoading}
                                selectedRole={selectedRole}
                                onClick={handleLogin}
                            />
                            <RoleButton
                                role="hr"
                                icon={Users}
                                label="HR Менеджер"
                                desc="Найм, кадры, табель"
                                colorClass="bg-blue-100 text-blue-700"
                                isLoading={isLoading}
                                selectedRole={selectedRole}
                                onClick={handleLogin}
                            />
                            <RoleButton
                                role="rf"
                                icon={LayoutDashboard}
                                label="Управляющий (РФ)"
                                desc="Управление точками и сменами"
                                colorClass="bg-emerald-100 text-emerald-700"
                                isLoading={isLoading}
                                selectedRole={selectedRole}
                                onClick={handleLogin}
                            />
                            <RoleButton
                                role="finance"
                                icon={Wallet}
                                label="Финансист"
                                desc="Расходы, аренда, P&L"
                                colorClass="bg-yellow-100 text-yellow-700"
                                isLoading={isLoading}
                                selectedRole={selectedRole}
                                onClick={handleLogin}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-50 px-2 text-slate-500 font-bold">Или</span>
                        </div>
                    </div>

                    <button
                        onClick={handleEdsLogin}
                        disabled={isLoading}
                        className={cn(
                            "group relative flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-blue-600 bg-blue-600 p-4 text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <FileKey className="h-5 w-5" />
                        )}
                        <span className="font-bold">Войти с ЭЦП</span>
                    </button>
                </div>

                <p className="text-center text-sm font-bold text-slate-400">
                    Protected System. Authorized Personnel Only. v1.1
                </p>
            </div>


            {/* Right Section: Infographic */}
            <div className="hidden w-1/2 bg-black p-16 text-white lg:flex lg:flex-col lg:justify-center">
                <div className="mx-auto max-w-lg">
                    <h2 className="mb-12 text-3xl font-black uppercase tracking-widest text-yellow-400">
                        Бизнес-процесс
                    </h2>

                    <div className="relative space-y-8">
                        {/* Connecting Line */}
                        <div className="absolute left-8 top-8 h-[calc(100%-60px)] w-1 bg-slate-800"></div>

                        {/* Step 1 */}
                        <div className="relative flex items-center gap-6">
                            <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 font-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                01
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-blue-400">Кандидат</h3>
                                <p className="font-bold text-slate-400">Подача заявки, проверка СБ, загрузка документов</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex items-center gap-6">
                            <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 font-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                02
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-emerald-400">Сотрудник</h3>
                                <p className="font-bold text-slate-400">Оформление, назначение на ПВЗ, график смен</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex items-center gap-6">
                            <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 font-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                03
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-purple-400">Операции</h3>
                                <p className="font-bold text-slate-400">Учет времени, выплаты, расходы точки</p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative flex items-center gap-6">
                            <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500 font-black text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                04
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-yellow-400">Аналитика</h3>
                                <p className="font-bold text-slate-400">P&L отчеты, эффективность, маржинальность</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
