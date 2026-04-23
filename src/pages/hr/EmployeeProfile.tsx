import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee } from "@/services/api";
import { DocumentsList } from "@/components/hr/DocumentsList";
import { Edit2, Save, Loader2, User, Phone, Mail, IdCard, Calendar, MapPin, Briefcase, CreditCard, Users, Clock, Trash2, Plus } from "lucide-react";
import { PhoneInput, IBANInput, IdCardInput, NumberInput } from "@/components/ui/masked-input";
import { cn } from "@/lib/utils";
import { TransferModal } from "@/components/hr/TransferModal";
import { TerminationModal } from "@/components/hr/TerminationModal";
import { DisciplineTab } from "@/components/hr/profile/DisciplineTab";
import { HistoryTab } from "@/components/hr/profile/HistoryTab";

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
            full_name: employee?.full_name || '',
            patronymic: employee?.patronymic || '',
            phone: employee?.phone || '',
            email: employee?.email || '',
            iban: employee?.iban || '',
            base_rate: employee?.base_rate ? String(employee.base_rate) : '',
            address: employee?.address || '',
            registered_address: employee?.registered_address || '',
            id_card_number: employee?.id_card_number || '',
            id_card_issued_by: employee?.id_card_issued_by || '',
            id_card_issue_date: employee?.id_card_issue_date ? new Date(employee.id_card_issue_date).toISOString().split('T')[0] : '',
            probation_until: employee?.probation_until ? new Date(employee.probation_until).toISOString().split('T')[0] : '',
            contract_end_date: employee?.contract_end_date ? new Date(employee.contract_end_date).toISOString().split('T')[0] : '',
            probation_months: employee?.probation_months ? String(employee.probation_months) : '',
            emergency_contacts: employee?.emergency_contacts && Array.isArray(employee.emergency_contacts) ? employee.emergency_contacts : [{ name: '', phone: '', relationship: '' }]
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
                                <p className="text-xs text-slate-500 mt-0.5">ИИН: {employee.iin}</p>
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

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-12 gap-6 mb-6">
                    {/* Personal Information */}
                    <div className="col-span-12 lg:col-span-6">
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><User className="w-4 h-4" /> Личная информация</h2>
                            </div>
                            <div className="p-5 space-y-0.5">
                                {isEditing ? (
                                    <>
                                        <EditField label="ФИО" value={editData.full_name} onChange={v => setEditData({...editData, full_name: v})} />
                                        <EditField label="Отчество" value={editData.patronymic || ''} onChange={v => setEditData({...editData, patronymic: v})} />
                                        <div className="py-2.5 border-b border-slate-100 last:border-0">
                                            <label className="block text-xs text-slate-500 font-medium mb-1">Телефон</label>
                                            <PhoneInput name="phone" value={editData.phone || ''} onChange={(e) => setEditData({...editData, phone: e.target.value})} />
                                        </div>
                                        <EditField label="Email" value={editData.email} onChange={v => setEditData({...editData, email: v})} />
                                        <div className="py-2.5 border-b border-slate-100 last:border-0">
                                            <label className="block text-xs text-slate-500 font-medium mb-1">IBAN</label>
                                            <IBANInput name="iban" value={editData.iban || ''} onChange={(e) => setEditData({...editData, iban: e.target.value})} />
                                        </div>
                                        <EditField label="Адрес прописки" value={editData.registered_address} onChange={v => setEditData({...editData, registered_address: v})} />
                                        <EditField label="Фактический адрес" value={editData.address} onChange={v => setEditData({...editData, address: v})} />
                                        <div className="py-2.5 border-b border-slate-100 last:border-0">
                                            <label className="block text-xs text-slate-500 font-medium mb-1">Номер УДЛ</label>
                                            <IdCardInput name="id_card_number" value={editData.id_card_number || ''} onChange={(e) => setEditData({...editData, id_card_number: e.target.value})} />
                                        </div>
                                        <EditField label="Кем выдан" value={editData.id_card_issued_by} onChange={v => setEditData({...editData, id_card_issued_by: v})} />
                                        <EditField label="Дата выдачи УДЛ" type="date" value={editData.id_card_issue_date} onChange={v => setEditData({...editData, id_card_issue_date: v})} />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow icon={<User className="w-4 h-4" />} label="ФИО" value={employee.full_name} />
                                        {iinInfo && <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата рождения" value={iinInfo.birthDate} extra={`${iinInfo.age} лет, ${iinInfo.gender}`} />}
                                        <InfoRow icon={<Phone className="w-4 h-4" />} label="Телефон" value={employee.phone} />
                                        <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={employee.email} />
                                        <InfoRow icon={<IdCard className="w-4 h-4" />} label="IBAN" value={employee.iban} />
                                        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Адрес прописки" value={employee.registered_address} />
                                        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Фактический адрес" value={employee.address} />
                                        <InfoRow icon={<IdCard className="w-4 h-4" />} label="Номер УДЛ" value={employee.id_card_number} />
                                        <InfoRow icon={<IdCard className="w-4 h-4" />} label="Кем выдан" value={employee.id_card_issued_by} />
                                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата выдачи УДЛ" value={employee.id_card_issue_date ? new Date(employee.id_card_issue_date).toLocaleDateString('ru-RU') : undefined} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Work Information */}
                    <div className="col-span-12 lg:col-span-6">
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><Briefcase className="w-4 h-4" /> Рабочая информация</h2>
                            </div>
                            <div className="p-5 space-y-0.5">
                                {isEditing ? (
                                    <>
                                        <div className="py-2.5 border-b border-slate-100 last:border-0">
                                            <label className="block text-xs text-slate-500 font-medium mb-1">Ставка (тенге)</label>
                                            <NumberInput name="base_rate" value={String(editData.base_rate || '')} onChange={(e) => setEditData({...editData, base_rate: e.target.value})} />
                                        </div>
                                        <EditField label="Окончание испытательного срока" type="date" value={editData.probation_until} onChange={v => setEditData({...editData, probation_until: v})} />
                                        <EditField label="Дата окончания договора" type="date" value={editData.contract_end_date} onChange={v => setEditData({...editData, contract_end_date: v})} />
                                        <EditField label="Испытательный срок (мес.)" type="number" value={editData.probation_months} onChange={v => setEditData({...editData, probation_months: v})} />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Должность" value={employee.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'} />
                                        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Основной ПВЗ" value={employee.main_pvz_name} extra={employee.main_pvz_address} />
                                        <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Юрлицо" value={employee.employer_name || 'Не назначено'} />
                                        <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Ставка" value={employee.base_rate ? `${employee.base_rate.toLocaleString()} ₸` : 'Не установлена'} />
                                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата найма" value={employee.hired_at ? new Date(employee.hired_at).toLocaleDateString('ru-RU') : 'Не нанят'} />
                                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Испытательный срок" value={employee.probation_until ? `до ${new Date(employee.probation_until).toLocaleDateString('ru-RU')}` : undefined} />
                                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата окончания договора" value={employee.contract_end_date ? new Date(employee.contract_end_date).toLocaleDateString('ru-RU') : 'Не указана'} />
                                        <InfoRow icon={<Clock className="w-4 h-4" />} label="Испытательный срок" value={employee.probation_months ? `${employee.probation_months} мес.` : undefined} />
                                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата создания" value={new Date(employee.created_at).toLocaleDateString('ru-RU')} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency Contacts */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><Users className="w-4 h-4" /> Экстренные контакты</h2>
                    </div>
                    <div className="p-5">
                        {isEditing ? (
                            <div className="space-y-4">
                                {(editData.emergency_contacts || []).map((contact: any, idx: number) => (
                                    <div key={idx} className="grid gap-3 md:grid-cols-4 items-end p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div>
                                            <label className="block text-xs text-slate-500 font-medium mb-1">ФИО</label>
                                            <input
                                                value={contact.name || ''}
                                                onChange={e => {
                                                    const updated = [...(editData.emergency_contacts || [])];
                                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                                    setEditData({ ...editData, emergency_contacts: updated });
                                                }}
                                                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="Иванов Иван"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-medium mb-1">Телефон</label>
                                            <PhoneInput
                                                name={`ec_phone_${idx}`}
                                                value={contact.phone || ''}
                                                onChange={(e) => {
                                                    const updated = [...(editData.emergency_contacts || [])];
                                                    updated[idx] = { ...updated[idx], phone: e.target.value };
                                                    setEditData({ ...editData, emergency_contacts: updated });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 font-medium mb-1">Кем приходится</label>
                                            <select
                                                value={contact.relationship || ''}
                                                onChange={e => {
                                                    const updated = [...(editData.emergency_contacts || [])];
                                                    updated[idx] = { ...updated[idx], relationship: e.target.value };
                                                    setEditData({ ...editData, emergency_contacts: updated });
                                                }}
                                                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="">Выберите...</option>
                                                <option value="мать">Мать</option>
                                                <option value="отец">Отец</option>
                                                <option value="супруг(а)">Супруг(а)</option>
                                                <option value="брат/сестра">Брат/Сестра</option>
                                                <option value="друг/подруга">Друг/Подруга</option>
                                                <option value="другое">Другое</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const updated = (editData.emergency_contacts || []).filter((_: any, i: number) => i !== idx);
                                                setEditData({ ...editData, emergency_contacts: updated });
                                            }}
                                            className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" /> Удалить
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const updated = [...(editData.emergency_contacts || []), { name: '', phone: '', relationship: '' }];
                                        setEditData({ ...editData, emergency_contacts: updated });
                                    }}
                                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Добавить контакт
                                </button>
                            </div>
                        ) : (
                            employee.emergency_contacts && Array.isArray(employee.emergency_contacts) && employee.emergency_contacts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {employee.emergency_contacts.map((contact: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{contact.relationship}</p>
                                            <p className="text-sm text-slate-700 mt-1">{contact.phone}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">Экстренные контакты не указаны</p>
                            )
                        )}
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
                        {activeTab === 'history' && <HistoryTab employeeId={id!} />}
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
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <div className="text-slate-400 mt-0.5 w-4">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
                {extra && <p className="text-xs text-slate-400 mt-0.5">{extra}</p>}
            </div>
        </div>
    );
}

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div className="py-2.5 border-b border-slate-100 last:border-0">
            <label className="block text-xs text-slate-500 font-medium mb-1">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
    );
}
