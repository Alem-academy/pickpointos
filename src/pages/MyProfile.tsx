import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Loader2, User, MapPin, Briefcase, Calendar,
    Banknote, AlertTriangle, ChevronRight, Phone,
    Mail, ShieldX, ArrowLeft, Fingerprint
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface EmployeeProfile {
    id: string;
    iin: string;
    full_name: string;
    role: string;
    status: string;
    phone?: string;
    email?: string;
    base_rate?: number;
    hired_at?: string;
    probation_until?: string;
    address?: string;
    main_pvz_name?: string;
    main_pvz_address?: string;
}

const ROLE_LABELS: Record<string, string> = {
    employee: 'Менеджер ПВЗ',
    rf: 'Региональный менеджер',
    hr: 'HR-менеджер',
    financier: 'Финансист',
    admin: 'Администратор',
    courier: 'Курьер',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Активен', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    new: { label: 'Оформляется', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    probation: { label: 'Испытательный срок', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    fired: { label: 'Уволен', color: 'text-red-700 bg-red-50 border-red-200' },
};

export default function MyProfile() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const iin = searchParams.get('iin') || '';
    const nameFromCert = searchParams.get('name') || '';

    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!iin) { setNotFound(true); setLoading(false); return; }

        fetch(`${API_URL}/api/employees/by-iin/${encodeURIComponent(iin)}`)
            .then(r => r.json())
            .then(data => {
                if (data.found) setEmployee(data.employee);
                else setNotFound(true);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [iin]);

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                    <p className="text-slate-500 font-medium">Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    /* ─── Not Found ─── */
    if (notFound || !employee) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            PVZ OS <span className="text-slate-400 font-medium text-base ml-1">v2.0</span>
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Портал сотрудника</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-5 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 shrink-0">
                                <ShieldX className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-red-300 font-bold text-base">Отказано в доступе</p>
                                <p className="text-red-400/70 text-xs mt-0.5">Ваш ИИН не зарегистрирован в системе</p>
                            </div>
                        </div>

                        <div className="px-6 py-6 space-y-4">
                            {nameFromCert && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 shrink-0">
                                        <User className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">ФИО из ЭЦП</p>
                                        <p className="text-white font-semibold">{nameFromCert}</p>
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

                        <div className="px-6 pb-6">
                            <button
                                onClick={() => navigate('/login')}
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

    /* ─── Employee Profile Found ─── */
    const status = STATUS_LABELS[employee.status] || { label: employee.status, color: 'text-slate-700 bg-slate-50 border-slate-200' };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                            <User className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold truncate">{employee.full_name}</h1>
                            <p className="text-slate-300 text-sm mt-0.5">
                                {ROLE_LABELS[employee.role] || employee.role}
                            </p>
                            <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* IIN */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ИИН</span>
                        <span className="font-mono text-sm font-semibold text-slate-800">{employee.iin}</span>
                    </div>

                    {/* Info rows */}
                    <div className="grid grid-cols-1 gap-3">
                        {employee.main_pvz_name && (
                            <InfoRow icon={<MapPin className="h-4 w-4" />} iconBg="bg-blue-50 text-blue-600"
                                label="Место работы" value={employee.main_pvz_name} sub={employee.main_pvz_address} />
                        )}
                        {employee.base_rate && (
                            <InfoRow icon={<Banknote className="h-4 w-4" />} iconBg="bg-emerald-50 text-emerald-600"
                                label="Оклад" value={`${Number(employee.base_rate).toLocaleString('ru-RU')} KZT`} />
                        )}
                        {employee.hired_at && (
                            <InfoRow icon={<Calendar className="h-4 w-4" />} iconBg="bg-violet-50 text-violet-600"
                                label="Дата приёма" value={new Date(employee.hired_at).toLocaleDateString('ru-RU')} />
                        )}
                        {employee.phone && (
                            <InfoRow icon={<Phone className="h-4 w-4" />} iconBg="bg-orange-50 text-orange-600"
                                label="Телефон" value={employee.phone} />
                        )}
                        {employee.email && (
                            <InfoRow icon={<Mail className="h-4 w-4" />} iconBg="bg-sky-50 text-sky-600"
                                label="Email" value={employee.email} />
                        )}
                    </div>

                    {/* CTA */}
                    {employee.status === 'active' ? (
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 font-semibold text-white hover:bg-slate-800 transition-colors"
                        >
                            Войти в систему <ChevronRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center space-y-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto" />
                            <p className="text-sm font-medium text-amber-800">
                                Ваш аккаунт ещё не активирован.<br />
                                <span className="text-amber-600 font-normal">Обратитесь к HR-менеджеру.</span>
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 mx-auto transition-colors"
                            >
                                <ArrowLeft className="h-3 w-3" /> Вернуться к входу
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-slate-300 py-4 border-t border-slate-50">
                    © 2025 Alem Lab · PickPoint OS
                </p>
            </div>
        </div>
    );
}

function InfoRow({ icon, iconBg, label, value, sub }: {
    icon: React.ReactNode; iconBg: string; label: string; value: string; sub?: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
            </div>
        </div>
    );
}
