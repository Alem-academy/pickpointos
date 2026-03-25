import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee } from "@/services/api";
import { DocumentsList } from "@/components/hr/DocumentsList";
import { Edit2, Save, Loader2, Briefcase, CreditCard, MapPin, Calendar, User, Phone, Mail, IdCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransferModal } from "@/components/hr/TransferModal";
import { TerminationModal } from "@/components/hr/TerminationModal";
import { DisciplineTab } from "@/components/hr/profile/DisciplineTab";

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

type Tab = 'documents' | 'history' | 'discipline';

export default function EmployeeProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
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
                const emp = await api.getEmployee(id);
                setEmployee(emp);
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
            base_rate: employee?.base_rate || '',
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

    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!employee) return <div className="flex h-full items-center justify-center text-muted-foreground">Сотрудник не найден</div>;

    const iinInfo = parseIIN(employee.iin);
    const statusColors: any = { active: 'bg-emerald-100 text-emerald-700', new: 'bg-blue-100 text-blue-700', review: 'bg-amber-100 text-amber-700', signing: 'bg-purple-100 text-purple-700', fired: 'bg-gray-100 text-gray-700', revision: 'bg-red-100 text-red-700' };
    const statusLabels: any = { active: 'Активен', new: 'Новый', review: 'На проверке', signing: 'Подписание', fired: 'Уволен', revision: 'На доработке' };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/hr/employees')} className="text-sm text-slate-600 hover:text-slate-900 font-medium">← Сотрудники</button>
                            <div className="h-5 w-px bg-slate-200" />
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">{employee.full_name}</h1>
                                <p className="text-xs text-slate-500 mt-0.5">{employee.iin} • {employee.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold", statusColors[employee.status])}>{statusLabels[employee.status]}</span>
                            {!isEditing ? (
                                <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"><Edit2 className="w-4 h-4" /> Редактировать</button>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600">Отмена</button>
                                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-2">Быстрые действия:</span>
                        <button onClick={() => setActiveTab('documents')} className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md">📄 Договор</button>
                        <button onClick={() => setActiveTab('documents')} className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md">📄 Приказ</button>
                        <button onClick={() => setActiveTab('documents')} className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md">📄 Заявление</button>
                        <button onClick={() => setActiveTab('documents')} className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md">📤 Загрузить</button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-12 gap-6 mb-6">
                    {/* Personal Data */}
                    <div className="col-span-12 lg:col-span-6">
                        <div className="bg-white rounded-lg border border-slate-200 p-5">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Личные данные</h2>
                            <div className="space-y-3">
                                {isEditing ? (
                                    <>
                                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Телефон</label><input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                                        <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                                        <div><label className="block text-xs font-medium text-slate-600 mb-1">IBAN</label><input value={editData.iban} onChange={e => setEditData({...editData, iban: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                                    </>
                                ) : (
                                    <>
                                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата рождения" value={iinInfo?.birthDate} extra={iinInfo ? `${iinInfo.age} лет, ${iinInfo.gender}` : ''} />
                                        <InfoRow icon={<Phone className="w-4 h-4" />} label="Телефон" value={employee.phone} />
                                        <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={employee.email} />
                                        <InfoRow icon={<IdCard className="w-4 h-4" />} label="IBAN" value={employee.iban} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Work Data */}
                    <div className="col-span-12 lg:col-span-6">
                        <div className="bg-white rounded-lg border border-slate-200 p-5">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Рабочие данные</h2>
                            <div className="space-y-3">
                                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Должность" value={employee.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'} />
                                <InfoRow icon={<MapPin className="w-4 h-4" />} label="ПВЗ" value={employee.main_pvz_name} />
                                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Юрлицо" value={employee.employer_name || 'Не назначено'} />
                                <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Ставка" value={employee.base_rate ? `${employee.base_rate.toLocaleString()} ₸` : 'Не установлена'} />
                                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата найма" value={employee.hired_at ? new Date(employee.hired_at).toLocaleDateString('ru-RU') : 'Не нанят'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-200">
                        <button onClick={() => setActiveTab('documents')} className={cn("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === 'documents' ? "bg-white text-slate-900 border-b-2 border-slate-900" : "bg-slate-50 text-slate-600 hover:text-slate-900")}>📄 Документы</button>
                        <button onClick={() => setActiveTab('history')} className={cn("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === 'history' ? "bg-white text-slate-900 border-b-2 border-slate-900" : "bg-slate-50 text-slate-600 hover:text-slate-900")}>📜 История</button>
                        <button onClick={() => setActiveTab('discipline')} className={cn("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === 'discipline' ? "bg-white text-slate-900 border-b-2 border-slate-900" : "bg-slate-50 text-slate-600 hover:text-slate-900")}>⚠️ Дисциплина</button>
                    </div>
                    <div className="p-6">
                        {activeTab === 'documents' && <DocumentsList employeeId={id!} employeeStatus={employee.status} onStatusChange={() => {}} />}
                        {activeTab === 'history' && <div className="text-center py-8 text-slate-500">История переводов и изменений</div>}
                        {activeTab === 'discipline' && <DisciplineTab employeeId={id!} hiredAt={employee.hired_at || new Date().toISOString()} />}
                    </div>
                </div>
            </div>

            {showTransferModal && <TransferModal employeeName={employee.full_name} currentPvzId={employee.main_pvz_id || undefined} onClose={() => setShowTransferModal(false)} onConfirm={async (pvzId, date, comment) => { await api.transferEmployee(employee.id, pvzId, date, comment); setShowTransferModal(false); }} />}
            {showTerminationModal && <TerminationModal employeeName={employee.full_name} onClose={() => setShowTerminationModal(false)} onConfirm={() => { setShowTerminationModal(false); navigate('/hr/employees'); }} />}
        </div>
    );
}

function InfoRow({ icon, label, value, extra }: { icon: any; label: string; value: string | null | undefined; extra?: string }) {
    return (
        <div className="flex items-start gap-3 py-1.5">
            <div className="text-slate-400 mt-0.5">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{value || '—'}</p>
                {extra && <p className="text-xs text-slate-400 mt-0.5">{extra}</p>}
            </div>
        </div>
    );
}
