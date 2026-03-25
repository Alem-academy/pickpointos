import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee } from "@/services/api";
import { DocumentsList } from "@/components/hr/DocumentsList";
import { Edit2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransferModal } from "@/components/hr/TransferModal";
import { TerminationModal } from "@/components/hr/TerminationModal";
import { DisciplineTab } from "@/components/hr/profile/DisciplineTab";
import { ProfileCompleteness } from "@/components/hr/ProfileCompleteness";

function parseIIN(iin: string | undefined) {
    if (!iin || iin.length !== 12) return null;
    const yy = parseInt(iin.substring(0, 2), 10);
    const mm = parseInt(iin.substring(2, 4), 10);
    const dd = parseInt(iin.substring(4, 6), 10);
    const centuryStr = iin.substring(6, 7);
    let year: number, gender: string;
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

type Tab = 'general' | 'documents' | 'discipline';

export default function EmployeeProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('documents');
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
            phone: employee?.phone || '',
            email: employee?.email || '',
            iban: employee?.iban || '',
            address: employee?.address || '',
            registered_address: employee?.registered_address || '',
            id_card_number: employee?.id_card_number || '',
            id_card_issued_by: employee?.id_card_issued_by || '',
            id_card_issue_date: employee?.id_card_issue_date ? new Date(employee.id_card_issue_date).toISOString().split('T')[0] : ''
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
    const statusColors: any = { active: 'bg-emerald-100 text-emerald-700', new: 'bg-blue-100 text-blue-700', review: 'bg-amber-100 text-amber-700', signing: 'bg-purple-100 text-purple-700', fired: 'bg-gray-100 text-gray-700', revision: 'bg-red-100 text-red-700' };
    const statusLabels: any = { active: 'Активен', new: 'Новый', review: 'На проверке', signing: 'Подписание', fired: 'Уволен', revision: 'На доработке' };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header - навигация и действия */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/hr/employees')} className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                                ← Сотрудники
                            </button>
                            <div className="h-4 w-px bg-slate-200" />
                            <div>
                                <h1 className="text-base font-bold text-slate-900">{employee.full_name}</h1>
                                <p className="text-xs text-slate-500 mt-0.5">{employee.iin}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold", statusColors[employee.status])}>{statusLabels[employee.status]}</span>
                            {!isEditing ? (
                                <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
                                    <Edit2 className="w-4 h-4" /> Изменить
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">Отмена</button>
                                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Main Content */}
                    <div className="col-span-12 lg:col-span-8">
                        {/* Key Info Cards - только важное */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 font-medium mb-1">Должность</p>
                                <p className="text-sm font-semibold text-slate-900">{employee.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 font-medium mb-1">ПВЗ</p>
                                <p className="text-sm font-semibold text-slate-900">{employee.main_pvz_name || '—'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 font-medium mb-1">Юрлицо</p>
                                <p className="text-sm font-semibold text-slate-900">{employee.employer_name || '—'}</p>
                            </div>
                        </div>

                        {/* Tabs - переключение между разделами */}
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
                            <div className="flex border-b border-slate-200">
                                <button onClick={() => setActiveTab('documents')} className={cn("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === 'documents' ? "bg-white text-slate-900 border-b-2 border-slate-900" : "bg-slate-50 text-slate-600 hover:text-slate-900")}>Документы</button>
                                <button onClick={() => setActiveTab('general')} className={cn("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === 'general' ? "bg-white text-slate-900 border-b-2 border-slate-900" : "bg-slate-50 text-slate-600 hover:text-slate-900")}>Данные</button>
                                <button onClick={() => setActiveTab('discipline')} className={cn("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === 'discipline' ? "bg-white text-slate-900 border-b-2 border-slate-900" : "bg-slate-50 text-slate-600 hover:text-slate-900")}>Дисциплина</button>
                            </div>
                            <div className="p-4">
                                {activeTab === 'documents' && <DocumentsList employeeId={id!} employeeStatus={employee.status} />}
                                {activeTab === 'general' && (
                                    <div className="space-y-6">
                                        {/* Personal Data */}
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-3">Личные данные</h3>
                                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                                {isEditing ? (
                                                    <>
                                                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Телефон</label><input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                                                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                                                        <div><label className="block text-xs font-medium text-slate-600 mb-1">IBAN</label><input value={editData.iban} onChange={e => setEditData({...editData, iban: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <InfoRow label="Дата рождения" value={iinInfo?.birthDate} extra={iinInfo ? `${iinInfo.age} лет, ${iinInfo.gender}` : ''} />
                                                        <InfoRow label="Телефон" value={employee.phone} />
                                                        <InfoRow label="Email" value={employee.email} />
                                                        <InfoRow label="IBAN" value={employee.iban} />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Work Data */}
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-3">Рабочие данные</h3>
                                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                                <InfoRow label="Дата найма" value={employee.hired_at ? new Date(employee.hired_at).toLocaleDateString('ru-RU') : 'Не нанят'} />
                                                <InfoRow label="Ставка" value={employee.base_rate ? `${employee.base_rate.toLocaleString()} ₸` : 'Не установлена'} />
                                                <InfoRow label="Юрлицо" value={employee.employer_name || 'Не назначено'} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'discipline' && <DisciplineTab employeeId={id!} hiredAt={employee.hired_at || new Date().toISOString()} />}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - прогресс заполнения */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="sticky top-6">
                            <ProfileCompleteness employee={employee} documents={employeeDocs} />
                        </div>
                    </div>
                </div>
            </div>

            {showTransferModal && <TransferModal employeeName={employee.full_name} currentPvzId={employee.main_pvz_id || undefined} onClose={() => setShowTransferModal(false)} onConfirm={async (pvzId, date, comment) => { await api.transferEmployee(employee.id, pvzId, date, comment); setShowTransferModal(false); }} />}
            {showTerminationModal && <TerminationModal employeeName={employee.full_name} onClose={() => setShowTerminationModal(false)} onConfirm={() => { setShowTerminationModal(false); navigate('/hr/employees'); }} />}
        </div>
    );
}

function InfoRow({ label, value, extra }: { label: string; value: string | null | undefined; extra?: string }) {
    return (
        <div className="flex justify-between items-start py-2 border-b border-slate-200 last:border-0">
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                {extra && <p className="text-xs text-slate-400 mt-0.5">{extra}</p>}
            </div>
            <p className="text-sm font-semibold text-slate-900 text-right">{value || '—'}</p>
        </div>
    );
}
