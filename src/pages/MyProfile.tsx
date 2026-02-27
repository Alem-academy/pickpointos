import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, User, MapPin, Calendar, Briefcase, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import api from "@/services/api";

interface EmployeePublic {
    id: string;
    iin: string;
    full_name: string;
    role: string;
    status: string;
    phone?: string;
    base_rate?: number;
    hired_at?: string;
    probation_until?: string;
    address?: string;
    main_pvz_name?: string;
    main_pvz_address?: string;
}

const ROLE_LABELS: Record<string, string> = {
    admin: "Администратор",
    hr: "HR-менеджер",
    rf: "Руководитель филиала",
    financier: "Финансист",
    employee: "Сотрудник",
    courier: "Курьер",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: "Активен", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    new: { label: "Новый", color: "text-blue-600 bg-blue-50 border-blue-100" },
    probation: { label: "Испытательный", color: "text-amber-600 bg-amber-50 border-amber-100" },
    fired: { label: "Уволен", color: "text-red-500 bg-red-50 border-red-100" },
};

function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(n?: number) {
    if (!n) return "—";
    return n.toLocaleString("ru-RU") + " ₸";
}

export default function MyProfile() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const iin = params.get("iin") || "";

    const [employee, setEmployee] = useState<EmployeePublic | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!iin) { setLoading(false); setNotFound(true); return; }

        api.get(`/employees/by-iin/${encodeURIComponent(iin)}`)
            .then(res => {
                if (res.data.found) setEmployee(res.data.employee);
                else setNotFound(true);
            })
            .catch(() => setError("Не удалось загрузить данные. Попробуйте позже."))
            .finally(() => setLoading(false));
    }, [iin]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">

                {/* Header logo */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        PVZ OS <span className="text-slate-400 font-medium text-base ml-1">v2.0</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Портал сотрудника</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                            <p className="text-slate-500 text-sm">Загружаем данные...</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                            <p className="text-slate-700 font-semibold mb-1">Ошибка загрузки</p>
                            <p className="text-sm text-slate-500">{error}</p>
                        </div>
                    )}

                    {/* Not Found */}
                    {!loading && !error && notFound && (
                        <div className="p-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                                <AlertCircle className="h-8 w-8 text-amber-500" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 mb-2">ИИН не найден в системе</h2>
                            <p className="text-sm text-slate-500 mb-1">
                                ИИН <span className="font-mono font-semibold text-slate-700">{iin || "—"}</span> не зарегистрирован.
                            </p>
                            <p className="text-sm text-slate-500 mt-3">
                                Обратитесь к HR-менеджеру для добавления вашего профиля в систему.
                            </p>
                        </div>
                    )}

                    {/* Found — show employee card */}
                    {!loading && !error && employee && (
                        <>
                            {/* Avatar header */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-7 flex items-center gap-5">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 shrink-0">
                                    <User className="h-8 w-8 text-white/80" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg leading-tight">{employee.full_name}</p>
                                    <p className="text-slate-300 text-sm mt-0.5">{ROLE_LABELS[employee.role] || employee.role}</p>
                                    <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_LABELS[employee.status]?.color || "text-slate-600 bg-slate-100"}`}>
                                        {STATUS_LABELS[employee.status]?.label || employee.status}
                                    </span>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="p-8 space-y-5">
                                {employee.main_pvz_name && (
                                    <InfoRow icon={<MapPin className="h-4 w-4" />} label="Филиал" value={employee.main_pvz_name} />
                                )}
                                {employee.main_pvz_address && (
                                    <InfoRow icon={<MapPin className="h-4 w-4 opacity-0" />} label="Адрес ПВЗ" value={employee.main_pvz_address} />
                                )}
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Дата найма" value={formatDate(employee.hired_at)} />
                                {employee.probation_until && (
                                    <InfoRow icon={<CheckCircle2 className="h-4 w-4" />} label="Конец испытательного" value={formatDate(employee.probation_until)} />
                                )}
                                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Базовая ставка" value={formatCurrency(employee.base_rate)} />

                                {/* IIN badge */}
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">ИИН</p>
                                    <p className="font-mono text-slate-700 font-semibold">{employee.iin}</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer action */}
                    {!loading && (
                        <div className="px-8 pb-8">
                            <button
                                onClick={() => navigate("/login")}
                                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Вернуться к входу
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">© 2025 Alem Lab. Protected System.</p>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-slate-800 font-medium">{value}</p>
            </div>
        </div>
    );
}
