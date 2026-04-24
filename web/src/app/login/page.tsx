"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LayoutDashboard, Users, ArrowRight, Loader2, ShieldCheck, Wallet, FileKey } from "lucide-react";
import { cn } from "@/lib/utils";
import { SigexService } from "@/services/sigex";
import { motion } from "framer-motion";
// @ts-ignore
import { NCALayerClient } from 'ncalayer-js-client';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'hr' | 'rf' | 'finance' | null>(null);

    const handleLogin = async (role: 'admin' | 'hr' | 'rf' | 'finance') => {
        setSelectedRole(role);
        setIsLoading(true);
        try {
            let email = '';
            switch (role) {
                case 'admin': email = 'admin@example.com'; break;
                case 'hr': email = 'hr@example.com'; break;
                case 'rf': email = 'manager@example.com'; break;
                case 'finance': email = 'finance@example.com'; break;
            }

            // if (role === 'finance') email = 'admin@example.com';

            await login(email);

            const target = role === 'rf' ? '/rf' : '/hr'; // Default targets
            // In Next.js we handle redirection here or in middleware. 
            // For now, simple redirect.
            router.push(target);
            toast.success(`Welcome back, ${role.toUpperCase()}!`);
        } catch (error) {
            console.error("Login failed", error);
            toast.error("Login failed. Please try again.");
        } finally {
            setIsLoading(false);
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
                toast.error("Ошибка подписи в NCALayer. Убедитесь, что NCALayer запущен.");
                setIsLoading(false);
                return;
            }

            if (!signature) {
                toast.error("Подпись не получена.");
                setIsLoading(false);
                return;
            }

            await SigexService.authenticate(signature);
            await login('eds_user@example.com');
            router.push('/hr');
            toast.success("Successfully logged in with EDS");

        } catch (error) {
            console.error("EDS Login failed", error);
            toast.error("Ошибка входа по ЭЦП");
        } finally {
            setIsLoading(false);
        }
    };

    const RoleButton = ({ role, icon: Icon, label, desc, colorClass }: any) => (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin(role)}
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
        </motion.button>
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Left Section: Login */}
            <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto w-full max-w-md space-y-8"
                >
                    <div>
                        <h1 className="text-5xl font-black tracking-tight text-slate-900">
                            PVZ OS
                        </h1>
                        <p className="mt-4 text-xl font-bold text-slate-500">
                            Операционная система управления сетью ПВЗ
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <RoleButton
                            role="admin"
                            icon={ShieldCheck}
                            label="Администратор"
                            desc="Полный доступ к системе"
                            colorClass="bg-slate-100 text-slate-900"
                        />
                        <RoleButton
                            role="hr"
                            icon={Users}
                            label="HR Менеджер"
                            desc="Найм, кадры, табель"
                            colorClass="bg-blue-100 text-blue-700"
                        />
                        <RoleButton
                            role="rf"
                            icon={LayoutDashboard}
                            label="Управляющий (РФ)"
                            desc="Управление точками и сменами"
                            colorClass="bg-emerald-100 text-emerald-700"
                        />
                        <RoleButton
                            role="finance"
                            icon={Wallet}
                            label="Финансист"
                            desc="Расходы, аренда, P&L"
                            colorClass="bg-yellow-100 text-yellow-700"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-50 px-2 text-slate-500 font-bold">Или</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleEdsLogin}
                        disabled={isLoading}
                        className="w-full h-14 text-lg font-bold rounded-2xl bg-blue-600 hover:bg-blue-700"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <FileKey className="mr-2 h-5 w-5" />
                        )}
                        Войти с ЭЦП
                    </Button>
                </motion.div>

                <p className="text-center text-sm font-bold text-slate-400 mt-8">
                    Protected System. Authorized Personnel Only.
                </p>
            </div>


            {/* Right Section: Infographic */}
            <div className="hidden w-1/2 bg-black p-16 text-white lg:flex lg:flex-col lg:justify-center">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto max-w-lg"
                >
                    <h2 className="mb-12 text-3xl font-black uppercase tracking-widest text-yellow-400">
                        Бизнес-процесс
                    </h2>

                    <div className="relative space-y-8">
                        {/* Connecting Line */}
                        <div className="absolute left-8 top-8 h-[calc(100%-60px)] w-1 bg-slate-800"></div>

                        {/* Steps */}
                        {[
                            { id: '01', title: 'Кандидат', desc: 'Подача заявки, проверка СБ, загрузка документов', color: 'bg-blue-600', text: 'text-blue-400' },
                            { id: '02', title: 'Сотрудник', desc: 'Оформление, назначение на ПВЗ, график смен', color: 'bg-emerald-600', text: 'text-emerald-400' },
                            { id: '03', title: 'Операции', desc: 'Учет времени, выплаты, расходы точки', color: 'bg-purple-600', text: 'text-purple-400' },
                            { id: '04', title: 'Аналитика', desc: 'P&L отчеты, эффективность, маржинальность', color: 'bg-yellow-500', text: 'text-yellow-400' }
                        ].map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="relative flex items-center gap-6"
                            >
                                <div className={cn("z-10 flex h-16 w-16 items-center justify-center rounded-2xl font-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]", step.color)}>
                                    {step.id}
                                </div>
                                <div>
                                    <h3 className={cn("text-xl font-black", step.text)}>{step.title}</h3>
                                    <p className="font-bold text-slate-400">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div >
    );
}
