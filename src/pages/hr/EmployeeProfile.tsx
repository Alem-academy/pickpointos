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
    FileWarning,
    Edit2,
    Save,
    Plus,
    Trash2,
    Loader2,
    CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TransferModal } from "@/components/hr/TransferModal";
import { TerminationModal } from "@/components/hr/TerminationModal";

import { OnboardingTab } from "@/components/hr/profile/OnboardingTab";
import { DisciplineTab } from "@/components/hr/profile/DisciplineTab";

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

type Tab = 'general' | 'documents' | 'history' | 'discipline';

// ...



export default function EmployeeProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);

    const [isEditingContacts, setIsEditingContacts] = useState(false);
    const [editContacts, setEditContacts] = useState<{ name: string, phone: string, relationship: string }[]>([]);
    const [isSavingContacts, setIsSavingContacts] = useState(false);

    const handleEditContactsClick = () => {
        setEditContacts(employee?.emergency_contacts || []);
        setIsEditingContacts(true);
    };

    const handleSaveContacts = async () => {
        if (!employee) return;
        setIsSavingContacts(true);
        const validContacts = editContacts.filter(c => c.name && c.phone && c.relationship);
        try {
            await api.updateEmployee(employee.id, {
                status: employee.status,
                emergency_contacts: validContacts.length > 0 ? validContacts : null
            } as any);
            const updated = await api.getEmployee(employee.id);
            setEmployee(updated);
            setIsEditingContacts(false);
        } catch (err) {
            console.error(err);
            alert('Ошибка при сохранении контактов');
        } finally {
            setIsSavingContacts(false);
        }
    };

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
            <div className="max-w-5xl">
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        {/* Onboarding Section - Visible only if not active */}
                        {employee.status !== 'active' && (
                            <OnboardingTab
                                employee={employee}
                                onUpdate={() => {
                                    api.getEmployee(employee.id).then(setEmployee);
                                }}
                            />
                        )}

                        {employee.status === 'revision' && (
                            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 flex gap-4 items-start shadow-sm">
                                <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                                    <FileWarning className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-orange-900 mb-1">Документы на доработке</h3>
                                    <p className="text-orange-800 text-sm">
                                        Один или несколько документов были отклонены. Сотруднику необходимо загрузить новые документы или вы можете сделать это за него во вкладке "Документы".
                                    </p>
                                    {employee.rejection_reason && (
                                        <div className="mt-3 p-3 rounded-lg bg-orange-100 border border-orange-200">
                                            <p className="text-sm font-semibold text-orange-900 mb-1">Причина отклонения:</p>
                                            <p className="text-orange-800">{employee.rejection_reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* БЛОК ЛИЧНЫЕ ДАННЫЕ */}
                            <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col">
                                <div className="mb-5 flex items-center gap-3 border-b pb-4">
                                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                        <UserX className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-bold text-lg">Личные данные</h3>
                                </div>
                                <div className="space-y-5 flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><UserX className="h-3 w-3" /> ИИН</p>
                                            <p className="font-mono bg-muted/50 px-2 py-1.5 rounded-md border inline-block text-sm font-medium">{employee.iin || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> IBAN</p>
                                            <p className="font-mono bg-muted/50 px-2 py-1.5 rounded-md border inline-block text-sm font-medium break-all">{employee.iban || '—'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Фактический адрес</p>
                                        <p className="text-sm font-medium bg-muted/30 p-2.5 rounded-lg border border-transparent">{employee.address || 'Не указан'}</p>
                                    </div>

                                    {/* Emergency Contacts */}
                                    <div className="pt-2 mt-auto">
                                        <div className="flex items-center justify-between mb-3 bg-slate-50 p-2 rounded-t-lg border-b">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Контакты родственников</p>
                                            {!isEditingContacts && (
                                                <button onClick={handleEditContactsClick} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors bg-white px-2 py-1 rounded shadow-sm border">
                                                    <Edit2 className="h-3 w-3" /> Изменить
                                                </button>
                                            )}
                                        </div>

                                        {isEditingContacts ? (
                                            <div className="space-y-3 bg-slate-50/50 p-3 rounded-b-lg border border-t-0">
                                                {editContacts.map((contact, index) => (
                                                    <div key={index} className="flex flex-col gap-2 p-3 rounded-lg bg-white border shadow-sm relative group">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">Контакт {index + 1}</span>
                                                            <button
                                                                title="Удалить"
                                                                onClick={() => setEditContacts(editContacts.filter((_, i) => i !== index))}
                                                                className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input value={contact.name} onChange={(e) => { const newC = [...editContacts]; newC[index].name = e.target.value; setEditContacts(newC); }} placeholder="ФИО" className="col-span-2 text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" />
                                                            <input value={contact.phone} onChange={(e) => { const newC = [...editContacts]; newC[index].phone = e.target.value; setEditContacts(newC); }} placeholder="Телефон" className="text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" />
                                                            <input value={contact.relationship} onChange={(e) => { const newC = [...editContacts]; newC[index].relationship = e.target.value; setEditContacts(newC); }} placeholder="Кем приходится" className="text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300" />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-between pt-2">
                                                    <button onClick={() => setEditContacts([...editContacts, { name: '', phone: '', relationship: '' }])} className="text-xs font-bold text-slate-600 hover:text-black flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-slate-200 transition-colors">
                                                        <Plus className="h-4 w-4" /> Добавить
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setIsEditingContacts(false)} className="px-4 py-2 text-xs border rounded-md font-semibold hover:bg-slate-100 flex items-center gap-1.5 text-slate-600 transition-colors">
                                                            Отмена
                                                        </button>
                                                        <button disabled={isSavingContacts} onClick={handleSaveContacts} className="px-4 py-2 text-xs bg-black text-white rounded-md font-semibold hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm">
                                                            {isSavingContacts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                            Сохранить
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50/50 p-4 rounded-b-lg border border-t-0">
                                                {employee.emergency_contacts && employee.emergency_contacts.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {employee.emergency_contacts.map((contact, index) => (
                                                            <div key={index} className="flex flex-col gap-1 p-3 bg-white rounded-lg border shadow-sm">
                                                                <div className="flex justify-between items-start">
                                                                    <span className="font-bold text-sm text-slate-800">{contact.name}</span>
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{contact.relationship}</span>
                                                                </div>
                                                                <a href={`tel:${contact.phone}`} className="text-primary hover:underline font-mono text-sm inline-flex items-center gap-1.5 mt-1 w-fit">
                                                                    <Phone className="h-3 w-3" /> {contact.phone}
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed rounded-lg bg-white">
                                                        <p className="text-sm font-medium text-slate-400">Контакты не указаны</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* БЛОК РАБОЧАЯ ИНФОРМАЦИЯ */}
                            <div className="flex flex-col gap-6">
                                <div className="rounded-2xl border bg-card p-6 shadow-sm flex-1">
                                    <div className="mb-5 flex items-center gap-3 border-b pb-4">
                                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-bold text-lg">Рабочая информация</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                            <p className="text-xs text-blue-600/80 uppercase font-bold tracking-wider mb-1">Должность</p>
                                            <p className="font-bold text-lg text-blue-950 flex items-center gap-2">
                                                {employee.role === 'rf' ? 'Региональный менеджер / РФ' : 'Менеджер ПВЗ'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Основной ПВЗ</p>
                                            <p className="font-semibold text-foreground bg-muted/30 p-2.5 rounded-lg border border-transparent">{employee.main_pvz_name || 'Не назначен'}</p>
                                        </div>
                                        {employee.base_rate && (
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> Ставка (Оклад)</p>
                                                <p className="font-bold text-lg text-emerald-600">{employee.base_rate.toLocaleString()} ₸ <span className="text-sm font-medium text-muted-foreground">/ смена</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                                    <div className="mb-5 flex items-center gap-3 border-b pb-4">
                                        <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-bold text-lg">Даты</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                            <p className="text-sm font-semibold text-muted-foreground">Дата найма</p>
                                            <p className="font-bold">
                                                {employee.hired_at
                                                    ? new Date(employee.hired_at).toLocaleDateString('ru-RU')
                                                    : '—'}
                                            </p>
                                        </div>
                                        {employee.probation_until && (
                                            <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                                                <p className="text-sm font-semibold text-orange-600/80">Испытательный срок</p>
                                                <p className="font-bold text-orange-600">
                                                    до {new Date(employee.probation_until).toLocaleDateString('ru-RU')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                    <DisciplineTab employeeId={employee.id} hiredAt={employee.hired_at || new Date().toISOString()} />
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

