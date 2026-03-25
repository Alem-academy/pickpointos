import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee } from "@/services/api";
import { DocumentsList } from "@/components/hr/DocumentsList";
import { Clock, Phone, Mail, Calendar, Briefcase, CreditCard, User, Edit2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransferModal } from "@/components/hr/TransferModal";
import { TerminationModal } from "@/components/hr/TerminationModal";
import { OnboardingTab } from "@/components/hr/profile/OnboardingTab";
import { DisciplineTab } from "@/components/hr/profile/DisciplineTab";
import { ProfileCompleteness } from "@/components/hr/ProfileCompleteness";

function parseIIN(iin: string | undefined) {
    if (!iin || iin.length !== 12) return null;
    const yy = parseInt(iin.substring(0, 2), 10);
    const mm = parseInt(iin.substring(2, 4), 10);
    const dd = parseInt(iin.substring(4, 6), 10);
    const centuryStr = iin.substring(6, 7);
    let year, gender;
    switch (centuryStr) {
        case '1': year = 1800 + yy; gender = 'Мужской'; break;
        case '2': year = 1800 + yy; gender = 'Женский'; break;
        case '3': year = 1900 + yy; gender = 'Мужской'; break;
        case '4': year = 1900 + yy; gender = 'Женский'; break;
        case '5': year = 2000 + yy; gender = 'Мужской'; break;
        case '6': year = 2000 + yy; gender = 'Женский'; break;
        default: return null;
    }
    const today = new Date();
    const age = today.getFullYear() - year;
    const isBeforeBirthday = today.getMonth() < mm - 1 || (today.getMonth() === mm - 1 && today.getDate() < dd);
    return { birthDate: `${dd.toString().padStart(2, '0')}.${mm.toString().padStart(2, '0')}.${year}`, age: isBeforeBirthday ? age - 1 : age, gender };
}

type Tab = 'general' | 'documents' | 'history' | 'discipline';

export default function EmployeeProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const [emp, docs] = await Promise.all([api.getEmployee(id), api.getDocuments(id)]);
                setEmployee(emp);
                setEmployeeDocs(docs);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        load();
    }, [id]);

    const handleEdit = () => {
        setEditData({
            iban: employee?.iban || '',
            address: employee?.address || '',
            registered_address: employee?.registered_address || '',
            id_card_number: employee?.id_card_number || '',
            id_card_issued_by: employee?.id_card_issued_by || '',
            id_card_issue_date: employee?.id_card_issue_date ? new Date(employee.id_card_issue_date).toISOString().split('T')[0] : '',
            phone: employee?.phone || '',
            email: employee?.email || ''
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!employee) return;
        setIsSaving(true);
        try {
            await api.updateEmployee(employee.id, { ...editData, status: employee.status } as any);
            const updated = await api.getEmployee(employee.id);
            setEmployee(updated);
            setIsEditing(false);
        } catch (err) { console.error(err); alert('Ошибка сохранения'); }
        finally { setIsSaving(false); }
    };

    if (isLoading) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
    if (!employee) return <div className="flex h-full items-center justify-center text-muted-foreground">Сотрудник не найден</div>;

    const iinInfo = parseIIN(employee.iin);
    const statusColors: any = { active: 'text-emerald-600 bg-emerald-50', new: 'text-blue-600 bg-blue-50', review: 'text-amber-600 bg-amber-50', signing: 'text-purple-600 bg-purple-50', fired: 'text-gray-600 bg-gray-50', revision: 'text-red-600 bg-red-50' };
    const statusLabels: any = { active: 'Активен', new: 'Новый', review: 'Проверка', signing: 'Подписание', fired: 'Уволен', revision: 'На доработке' };

    return (
        <div className="min-h-screen bg-white">
            {/* Compact Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/hr/employees')} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 leading-tight">{employee.full_name}</h1>
                                <p className="text-xs text-slate-500">{employee.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'} • {employee.main_pvz_name || 'Без ПВЗ'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusColors[employee.status])}>{statusLabels[employee.status]}</span>
                            {!isEditing ? (
                                <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    <Edit2 className="w-4 h-4" /> Редактировать
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">Отмена</button>
                                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Content Grid */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Main Content - 8 cols */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {/* Personal Info */}
                        <section className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Личная информация</h2>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
                                <InfoField label="ИИН" value={employee.iin} icon={<User className="w-4 h-4" />} />
                                <InfoField label="Дата рождения" value={iinInfo?.birthDate} extra={iinInfo ? `${iinInfo.age} лет, ${iinInfo.gender}` : ''} icon={<Calendar className="w-4 h-4" />} />
                                {isEditing ? (
                                    <>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Телефон</label>
                                            <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                                            <input value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <InfoField label="Телефон" value={employee.phone} icon={<Phone className="w-4 h-4" />} />
                                        <InfoField label="Email" value={employee.email} icon={<Mail className="w-4 h-4" />} />
                                    </>
                                )}
                            </div>
                        </section>

                        {/* Work Info */}
                        <section className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Рабочая информация</h2>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
                                <InfoField label="Дата найма" value={employee.hired_at ? new Date(employee.hired_at).toLocaleDateString('ru-RU') : 'Не нанят'} icon={<Clock className="w-4 h-4" />} />
                                <InfoField label="Ставка" value={employee.base_rate ? `${employee.base_rate.toLocaleString()} ₸` : 'Не установлена'} icon={<CreditCard className="w-4 h-4" />} />
                                <InfoField label="ПВЗ" value={employee.main_pvz_name} icon={<Briefcase className="w-4 h-4" />} />
                                <InfoField label="Юрлицо" value={employee.employer_name || 'Не назначено'} icon={<Briefcase className="w-4 h-4" />} />
                            </div>
                        </section>

                        {/* Tabs */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="flex border-b border-slate-200">
                                {(['general', 'documents', 'discipline'] as Tab[]).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 px-4 py-2.5 text-sm font-medium transition-colors", activeTab === tab ? "bg-white text-slate-900 border-b-2 border-slate-900" : "bg-slate-50 text-slate-600 hover:text-slate-900")}>
                                        {tab === 'general' ? 'Общее' : tab === 'documents' ? 'Документы' : 'Дисциплина'}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4">
                                {activeTab === 'general' && <OnboardingTab employee={employee!} onUpdate={() => {}} />}
                                {activeTab === 'documents' && <DocumentsList employeeId={id!} employeeStatus={employee.status} />}
                                {activeTab === 'discipline' && <DisciplineTab employeeId={id!} hiredAt={employee.hired_at || new Date().toISOString()} />}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - 4 cols */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="sticky top-20 space-y-4">
                            <ProfileCompleteness employee={employee} documents={employeeDocs} />
                        </div>
                    </div>
                </div>
            </div>

            {showTransferModal && <TransferModal employeeName={employee.full_name} currentPvzId={employee.main_pvz_id || undefined} onClose={() => setShowTransferModal(false)} onConfirm={async (pvzId, date, comment) => { await api.transferEmployee(employee.id, pvzId, date, comment); setShowTransferModal(false); const updated = await api.getEmployee(id!); setEmployee(updated); }} />}
            {showTerminationModal && <TerminationModal employeeName={employee.full_name} onClose={() => setShowTerminationModal(false)} onConfirm={() => { setShowTerminationModal(false); navigate('/hr/employees'); }} />}
        </div>
    );
}

function InfoField({ label, value, extra, icon }: any) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="text-slate-400 mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-900 leading-tight mt-0.5">{value || '—'}</p>
                {extra && <p className="text-xs text-slate-500 mt-0.5">{extra}</p>}
            </div>
        </div>
    );
}
