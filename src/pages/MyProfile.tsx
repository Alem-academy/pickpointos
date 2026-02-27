import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldX, User, ArrowLeft, Fingerprint } from "lucide-react";

export default function MyProfile() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const iin = params.get("iin") || "";
    const name = params.get("name") || "";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        PVZ OS <span className="text-slate-400 font-medium text-base ml-1">v2.0</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Портал сотрудника</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                    {/* Red denied banner */}
                    <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 shrink-0">
                            <ShieldX className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-red-300 font-bold text-base">Отказано в доступе</p>
                            <p className="text-red-400/70 text-xs mt-0.5">
                                Ваш ИИН не зарегистрирован в системе
                            </p>
                        </div>
                    </div>

                    {/* Cert data */}
                    <div className="px-6 py-6 space-y-4">

                        {name && (
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 shrink-0">
                                    <User className="h-4 w-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">ФИО из ЭЦП</p>
                                    <p className="text-white font-semibold">{name}</p>
                                </div>
                            </div>
                        )}

                        {iin && (
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 shrink-0">
                                    <Fingerprint className="h-4 w-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">ИИН</p>
                                    <p className="font-mono text-white font-semibold tracking-wider">{iin}</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-3 border-t border-white/5">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Ваша личность подтверждена через ЭЦП, однако данный ИИН не найден в базе сотрудников.
                                Обратитесь к <span className="text-white font-medium">HR-менеджеру</span> для добавления вашего профиля.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={() => navigate("/login")}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Вернуться к входу
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">© 2025 Alem Lab. Protected System.</p>
            </div>
        </div>
    );
}
