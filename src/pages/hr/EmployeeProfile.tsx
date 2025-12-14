import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee } from "@/services/api";
import { DocumentsList } from "@/components/hr/DocumentsList";
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Briefcase,
    ArrowRight,
    UserX,
    Award,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TransferModal } from "@/components/hr/TransferModal";
import { TerminationModal } from "@/components/hr/TerminationModal";

const STATUS_LABELS = {
    new: 'Новый',
    review: 'На проверке',
    revision: 'Доработка',
    signing: 'Подписание',
    active: 'Активен',
    fired: 'Уволен',
} as const;

const STATUS_COLORS = {
    new: 'text-blue-600 bg-blue-50 border-blue-200',
    review: 'text-amber-600 bg-amber-50 border-amber-200',
    revision: 'text-orange-600 bg-orange-50 border-orange-200',
    signing: 'text-purple-600 bg-purple-50 border-purple-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    fired: 'text-slate-600 bg-slate-50 border-slate-200',
} as const;

type Tab = 'general' | 'history' | 'documents' | 'discipline';

export default function EmployeeProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);

    useEffect(() => {
        const loadEmployee = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await api.getEmployee(id);
                setEmployee(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadEmployee();
    }, [id]);

    const handleTransfer = async (pvzId: string, date: string, comment: string) => {
        if (!employee) return;
        try {
            await api.transferEmployee(employee.id, pvzId, date, comment);
            setShowTransferModal(false);
            // Reload
            const updated = await api.getEmployee(id!);
            setEmployee(updated);
        } catch (err) {
            console.error(err);
            alert('Ошибка перевода');
        }
    };

    const handleTermination = async (reason: string, date: string, comment: string) => {
        console.log('Termination:', { reason, date, comment });
        // TODO: Implement API call
        setShowTerminationModal(false);
        alert(`Сотрудник уволен (mock)`);
        navigate('/hr/employees');
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex h-full flex-col items-center justify-center">
                <p className="text-muted-foreground">Сотрудник не найден</p>
                <button
                    onClick={() => navigate('/hr/employees')}
                    className="mt-4 text-sm text-primary hover:underline"
                >
                    Вернуться к списку
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/hr/employees')}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад к списку
                </button>

                <div className="flex items-start justify-between">
                    <div className="flex gap-6">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-900 shadow-inner">
                            {employee.full_name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight">{employee.full_name}</h1>
                            <div className="mt-2 flex items-center gap-3">
                                <span className={cn("rounded-full border px-3 py-1 text-sm font-bold", STATUS_COLORS[employee.status])}>
                                    {STATUS_LABELS[employee.status]}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    {employee.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'}
                                </span>
                            </div>
                            <div className="mt-4 flex gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{employee.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{employee.email || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {employee.status === 'active' && (
                            <>
                                <button
                                    onClick={() => setShowTransferModal(true)}
                                    className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Перевести
                                </button>
                                <button
                                    onClick={() => setShowTerminationModal(true)}
                                    className="flex items-center gap-2 rounded-xl border-2 border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
                                >
                                    <UserX className="h-4 w-4" />
                                    Уволить
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 border-b">
                <div className="flex gap-8">
                    {(['general', 'documents', 'history', 'discipline'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "border-b-2 pb-3 text-sm font-bold transition-colors",
                                activeTab === tab
                                    ? "border-black text-black"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab === 'general' && 'Общие данные'}
                            {tab === 'documents' && 'Документы'}
                            {tab === 'history' && 'История'}
                            {tab === 'discipline' && 'Дисциплина'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl">
                {activeTab === 'general' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h3 className="mb-4 font-bold text-lg">Место работы</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Основной ПВЗ</p>
                                        <p className="font-bold">{employee.main_pvz_name || 'Не назначен'}</p>
                                        {employee.main_pvz_name && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {/* Address would be here if we fetched it */}
                                                Адрес точки
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {employee.base_rate && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-green-50 p-2 text-green-600">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Ставка</p>
                                            <p className="font-bold">{employee.base_rate} ₸ / смена</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h3 className="mb-4 font-bold text-lg">Даты</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Дата найма</p>
                                        <p className="font-bold">
                                            {employee.hired_at
                                                ? new Date(employee.hired_at).toLocaleDateString('ru-RU')
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                                {employee.probation_until && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Испытательный срок до</p>
                                            <p className="font-bold">
                                                {new Date(employee.probation_until).toLocaleDateString('ru-RU')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <DocumentsList
                            employeeId={employee.id}
                            employeeStatus={employee.status}
                            onStatusChange={() => window.location.reload()}
                        />
                    </div>
                )}

                {activeTab === 'discipline' && (
                    <DisciplineTabContent employeeId={employee.id} hiredAt={employee.hired_at || new Date().toISOString()} />
                )}

                {activeTab === 'history' && (
                    <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
                        <p>История изменений пока пуста</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showTransferModal && (
                <TransferModal
                    employeeName={employee.full_name}
                    currentPvzId={employee.main_pvz_id || undefined}
                    onClose={() => setShowTransferModal(false)}
                    onConfirm={handleTransfer}
                />
            )}

            {showTerminationModal && (
                <TerminationModal
                    employeeName={employee.full_name}
                    onClose={() => setShowTerminationModal(false)}
                    onConfirm={handleTermination}
                />
            )}
        </div>
    );
}

function DisciplineTabContent({ employeeId, hiredAt }: { employeeId: string, hiredAt: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [bonusInfo, setBonusInfo] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const recs = await api.getDisciplineRecords(employeeId);
                setRecords(recs);

                // Calculate bonus locally for now
                const hireDate = new Date(hiredAt);
                const now = new Date();
                const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

                let bonus = 0;
                let nextBonus = 0;
                let monthsToNext = 0;

                if (months >= 36) { bonus = 100000; }
                else if (months >= 24) { bonus = 50000; nextBonus = 100000; monthsToNext = 36 - months; }
                else if (months >= 12) { bonus = 20000; nextBonus = 50000; monthsToNext = 24 - months; }
                else if (months >= 6) { bonus = 15000; nextBonus = 20000; monthsToNext = 12 - months; }
                else { nextBonus = 15000; monthsToNext = 6 - months; }

                setBonusInfo({
                    tenureMonths: months,
                    currentBonus: bonus,
                    nextBonus: { amount: nextBonus, monthsLeft: monthsToNext }
                });
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, [employeeId, hiredAt]);

    return (
        <div className="space-y-6">
            {/* Bonus Card */}
            {bonusInfo && (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Бонус за стаж</h3>
                            <p className="text-sm text-muted-foreground">Стаж работы: {bonusInfo.tenureMonths} мес.</p>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Текущий бонус</p>
                            <p className="text-2xl font-black text-green-600">{bonusInfo.currentBonus.toLocaleString()} ₸</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Следующий уровень</p>
                            <p className="text-2xl font-black text-slate-900">{bonusInfo.nextBonus.amount.toLocaleString()} ₸</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>Прогресс</span>
                            <span>Осталось {bonusInfo.nextBonus.monthsLeft} мес.</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="absolute left-0 top-0 h-full bg-yellow-400 transition-all duration-1000"
                                style={{ width: `${Math.min(100, (bonusInfo.tenureMonths / (bonusInfo.tenureMonths + bonusInfo.nextBonus.monthsLeft)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Discipline Records */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-bold text-lg">История взысканий</h3>
                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Award className="h-12 w-12 text-slate-200 mb-2" />
                        <p>Нарушений нет. Отличная работа!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map(record => (
                            <div key={record.id} className="flex items-start gap-4 rounded-xl border p-4 bg-red-50/50 border-red-100">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-red-900">{record.reason}</span>
                                        <span className="rounded bg-white px-2 py-0.5 text-xs font-bold uppercase border shadow-sm">{record.type}</span>
                                    </div>
                                    <p className="text-sm text-red-700 mt-1">{record.date}</p>
                                    {record.comment && <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border border-red-100">{record.comment}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
