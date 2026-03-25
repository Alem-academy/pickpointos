import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee, type Employer } from "@/services/api";
import { DocumentsList } from "@/components/hr/DocumentsList";
import { Clock, CheckCircle2, FileWarning, Briefcase, UserX, Save, CreditCard, Plus, Calendar, Edit2, Trash2, Loader2, MapPin, Phone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransferModal } from "@/components/hr/TransferModal";
import { TerminationModal } from "@/components/hr/TerminationModal";

import { OnboardingTab } from "@/components/hr/profile/OnboardingTab";
import { DisciplineTab } from "@/components/hr/profile/DisciplineTab";
import { EmployeeHero } from "@/components/hr/profile/EmployeeHero";

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
    const isBeforeBirthday = today.getMonth() < mm - 1 ||
        (today.getMonth() === mm - 1 && today.getDate() < dd);

    return {
        birthDate: `${dd.toString().padStart(2, '0')}.${mm.toString().padStart(2, '0')}.${year}`,
        age: isBeforeBirthday ? age - 1 : age,
        gender
    };
}

function getEmergencyContacts(contacts: any): { name: string, phone: string, relationship: string }[] {
    if (!contacts) return [];
    if (Array.isArray(contacts)) return contacts;
    if (typeof contacts === 'string') {
        try {
            return JSON.parse(contacts) || [];
        } catch (e) {
            console.error("Failed to parse emergency_contacts", e);
            return [];
        }
    }
    return [];
}

type Tab = 'general' | 'documents' | 'history' | 'discipline';

// ...



export default function EmployeeProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);

    const [isEditingContacts, setIsEditingContacts] = useState(false);
    const [editContacts, setEditContacts] = useState<{ name: string, phone: string, relationship: string }[]>([]);
    const [isSavingContacts, setIsSavingContacts] = useState(false);

    const [isEditingData, setIsEditingData] = useState(false);
    const [editIban, setEditIban] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editIdCardNumber, setEditIdCardNumber] = useState('');
    const [editIdCardIssuedBy, setEditIdCardIssuedBy] = useState('');
    const [editIdCardIssueDate, setEditIdCardIssueDate] = useState('');
    const [editRegisteredAddress, setEditRegisteredAddress] = useState('');
    const [isSavingData, setIsSavingData] = useState(false);
    const [editIbanInput, setEditIbanInput] = useState('');
    const [isSavingIban, setIsSavingIban] = useState(false);
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [editEmployerId, setEditEmployerId] = useState('');
    const [isEditingEmployer, setIsEditingEmployer] = useState(false);

    const handleEditDataClick = () => {
        setEditIban(employee?.iban || '');
        setEditAddress(employee?.address || '');
        setEditIdCardNumber(employee?.id_card_number || '');
        setEditIdCardIssuedBy(employee?.id_card_issued_by || '');
        setEditIdCardIssueDate(employee?.id_card_issue_date ? new Date(employee.id_card_issue_date).toISOString().split('T')[0] : '');
        setEditRegisteredAddress(employee?.registered_address || '');
        setEditEmployerId(employee?.employer_id || '');
        setIsEditingData(true);
    };

    const handleSaveData = async () => {
        if (!employee) return;
        setIsSavingData(true);
        try {
            await api.updateEmployee(employee.id, {
                status: employee.status,
                iban: editIban,
                address: editAddress,
                id_card_number: editIdCardNumber,
                id_card_issued_by: editIdCardIssuedBy,
                id_card_issue_date: editIdCardIssueDate || null,
                registered_address: editRegisteredAddress,
                employer_id: editEmployerId || null
            } as any);
            const updated = await api.getEmployee(employee.id);
            setEmployee(updated);
            setIsEditingData(false);
        } catch (err) {
            console.error(err);
            alert('Ошибка при сохранении данных');
        } finally {
            setIsSavingData(false);
        }
    };

    
    const handleSaveIban = async () => {
        if (!employee || !editIbanInput.trim()) return;
        setIsSavingIban(true);
        try {
            await api.updateEmployee(employee.id, {
                status: employee.status,
                iban: editIbanInput.trim().toUpperCase()
            } as any);
            const updated = await api.getEmployee(employee.id);
            setEmployee(updated);
            setEditIbanInput('');
        } catch (err) {
            console.error(err);
            alert('Ошибка при сохранении IBAN');
        } finally {
            setIsSavingIban(false);
        }
    };

    const handleEditContactsClick = () => {
        setEditContacts(getEmergencyContacts(employee?.emergency_contacts));
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
                
                try {
                    const docs = await api.getDocuments(id);
                    setEmployeeDocs(docs);
                } catch (e) {
                    console.error("Failed to load documents for photo", e);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadEmployee();
    }, [id]);

    // Load employers list
    useEffect(() => {
        api.getEmployers().then(setEmployers).catch(console.error);
    }, []);

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

    const iinInfo = parseIIN(employee.iin);
    const safeEmergencyContacts = getEmergencyContacts(employee.emergency_contacts);
    const photoDoc = employeeDocs.find(d => d.type === 'photo');
    const photoUrl = photoDoc?.thumbnail_url || photoDoc?.scan_url;

    return (
        <div className="bg-slate-50/50 min-h-screen pb-12">
            {/* Hero Section */}
            <EmployeeHero 
                employee={employee}
                photoUrl={photoUrl}
                onEdit={handleEditDataClick}
            />

            {/* Main Content */}
            <div className="mx-auto max-w-5xl px-6">
                {/* Stats Widget */}
                <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6 flex flex-wrap gap-4 md:gap-8 justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Дата найма</p>
                            <p className="font-semibold">{employee.hired_at ? new Date(employee.hired_at).toLocaleDateString('ru-RU') : 'Оформляется'}</p>
                        </div>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-border"></div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Текущая ставка</p>
                            <p className="font-semibold">{employee.base_rate ? `${employee.base_rate.toLocaleString()} ₸` : 'Не установлена'}</p>
                        </div>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-border"></div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                            <FileWarning className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Дисциплина</p>
                            <p className="font-semibold">Нет нарушений</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 bg-white rounded-xl shadow-sm border p-1.5 flex gap-1 inline-flex overflow-x-auto w-full md:w-auto">
                    {(['general', 'documents', 'history', 'discipline'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-2.5 text-sm font-bold transition-all rounded-lg",
                                activeTab === tab
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            {tab === 'general' && 'Общие данные'}
                            {tab === 'documents' && 'Документы'}
                            {tab === 'history' && 'История'}
                            {tab === 'discipline' && 'Дисциплина'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="mt-6">
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
                                <div className="mb-5 flex justify-between items-center border-b pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                            <UserX className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-bold text-lg">Личные данные</h3>
                                    </div>
                                    {!isEditingData && (
                                        <button onClick={handleEditDataClick} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg shadow-sm border">
                                            <Edit2 className="h-3 w-3" /> Редактировать
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-5 flex-1">
                                    {isEditingData ? (
                                        <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border">
                                            {/* Passport editing */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Номер УДЛ</label>
                                                    <input value={editIdCardNumber} onChange={e => setEditIdCardNumber(e.target.value)} placeholder="012345678" className="w-full text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Дата выдачи</label>
                                                    <input type="date" value={editIdCardIssueDate} onChange={e => setEditIdCardIssueDate(e.target.value)} className="w-full text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Орган выдачи</label>
                                                <input value={editIdCardIssuedBy} onChange={e => setEditIdCardIssuedBy(e.target.value)} placeholder="МВД РК" className="w-full text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                            </div>
                                            
                                            {/* Address Editing */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Адрес прописки (Юридический)</label>
                                                <textarea value={editRegisteredAddress} onChange={e => setEditRegisteredAddress(e.target.value)} placeholder="Город, Улица, Дом, Квартира..." rows={2} className="w-full text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 block">
                                                    <label className="text-xs font-bold text-slate-600">Фактический адрес проживания</label>
                                                    <button type="button" onClick={() => setEditAddress(editRegisteredAddress)} className="text-[10px] text-primary/80 hover:text-primary font-bold">Скопировать из прописки</button>
                                                </div>
                                                <textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Город, Улица, Дом, Квартира..." rows={2} className="w-full text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">IBAN (Счет)</label>
                                                <input value={editIban} onChange={e => setEditIban(e.target.value)} placeholder="KZ..." className="w-full text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase font-mono" />
                                            </div>
                                            <div className="flex gap-2 justify-end pt-2">
                                                <button onClick={() => setIsEditingData(false)} className="px-4 py-2 text-xs border rounded-md font-semibold hover:bg-slate-100 text-slate-600 transition-colors">
                                                    Отмена
                                                </button>
                                                <button disabled={isSavingData} onClick={handleSaveData} className="px-4 py-2 text-xs bg-black text-white rounded-md font-semibold hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                                                    {isSavingData ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                    Сохранить
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><UserX className="h-3 w-3" /> ИИН</p>
                                                <p className="font-mono bg-muted/50 px-2 py-1.5 rounded-md border inline-block text-sm font-medium">{employee.iin || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> IBAN</p>
                                                {employee.iban ? (
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-mono bg-indigo-50/50 border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md border inline-block text-sm font-semibold">
                                                            {employee.iban}
                                                        </p>
                                                        <button 
                                                            onClick={() => { setEditIbanInput(employee.iban || ''); }} 
                                                            className="text-xs text-primary hover:text-primary/80 font-semibold"
                                                        >
                                                            Изменить
                                                        </button>
                                                    </div>
                                                ) : editIbanInput ? (
                                                    <div className="flex items-center gap-2 col-span-2 bg-slate-50 p-3 rounded-lg border">
                                                        <input 
                                                            value={editIbanInput} 
                                                            onChange={(e) => setEditIbanInput(e.target.value.toUpperCase())} 
                                                            placeholder="KZ..." 
                                                            className="flex-1 text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase font-mono"
                                                            autoFocus
                                                        />
                                                        <button 
                                                            disabled={isSavingIban || !editIbanInput.trim()} 
                                                            onClick={handleSaveIban} 
                                                            className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {isSavingIban ? 'Сохранение...' : 'Сохранить'}
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditIbanInput('')} 
                                                            className="px-3 py-2 text-xs border rounded-md font-semibold hover:bg-slate-100 text-slate-600 transition-colors"
                                                        >
                                                            Отмена
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setEditIbanInput('KZ')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 inline-flex items-center gap-1 transition-colors">
                                                        <Plus className="h-3 w-3" /> Добавить IBAN
                                                    </button>
                                                )}
                                            </div>
                                            {iinInfo && (
                                                <>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Дата рождения</p>
                                                        <p className="font-medium bg-muted/50 px-2 py-1.5 rounded-md border inline-block text-sm">{iinInfo.birthDate} <span className="text-muted-foreground ml-1">({iinInfo.age} лет)</span></p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><UserX className="h-3 w-3" /> Пол</p>
                                                        <p className="font-medium bg-muted/50 px-2 py-1.5 rounded-md border inline-block text-sm">{iinInfo.gender}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {!isEditingData && (
                                        <div className="bg-slate-50/50 rounded-lg p-3 border mt-4">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> Удостоверение личности</p>
                                            {employee.id_card_number ? (
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-slate-500 mr-1">№:</span>
                                                        <span className="font-mono font-medium">{employee.id_card_number}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 mr-1">Выдан:</span>
                                                        <span className="font-medium">{employee.id_card_issue_date ? new Date(employee.id_card_issue_date).toLocaleDateString('ru-RU') : '—'}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-slate-500 mr-1">Орган:</span>
                                                        <span className="font-medium">{employee.id_card_issued_by || '—'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={handleEditDataClick} className="text-xs font-semibold text-primary/80 hover:text-primary bg-primary/5 px-2 py-1.5 rounded border border-primary/20 border-dashed inline-flex items-center gap-1">
                                                    <Plus className="h-3 w-3" /> Добавить данные УДЛ
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!isEditingData && (
                                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Прописка</p>
                                                {employee.registered_address ? (
                                                    <p className="text-sm font-medium bg-muted/30 p-2.5 rounded-lg border border-transparent min-h-[42px]">{employee.registered_address}</p>
                                                ) : (
                                                    <button onClick={handleEditDataClick} className="text-xs font-semibold text-primary/80 hover:text-primary bg-primary/5 px-3 py-2.5 rounded-lg border border-primary/20 border-dashed w-full text-left flex items-center gap-1.5 min-h-[42px]">
                                                        <Plus className="h-3.5 w-3.5" /> Указать прописку
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Фактический адрес</p>
                                                {employee.address ? (
                                                    <p className="text-sm font-medium bg-muted/30 p-2.5 rounded-lg border border-transparent min-h-[42px]">{employee.address}</p>
                                                ) : (
                                                    <button onClick={handleEditDataClick} className="text-xs font-semibold text-primary/80 hover:text-primary bg-primary/5 px-3 py-2.5 rounded-lg border border-primary/20 border-dashed w-full text-left flex items-center gap-1.5 min-h-[42px]">
                                                        <Plus className="h-3.5 w-3.5" /> Указать адрес
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

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
                                                {safeEmergencyContacts.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {safeEmergencyContacts.map((contact, index) => (
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
                                    <div className="mb-5 flex items-center justify-between border-b pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <h3 className="font-bold text-lg">Рабочая информация</h3>
                                        </div>
                                        {isEditingEmployer && (
                                            <button 
                                                onClick={async () => {
                                                    if (!employee) return;
                                                    try {
                                                        await api.updateEmployee(employee.id, {
                                                            status: employee.status,
                                                            employer_id: editEmployerId || null
                                                        } as any);
                                                        const updated = await api.getEmployee(employee.id);
                                                        setEmployee(updated);
                                                        setIsEditingEmployer(false);
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Ошибка при сохранении');
                                                    }
                                                }}
                                                className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200"
                                            >
                                                <Save className="h-3.5 w-3.5" /> Сохранить
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-5">
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                            <p className="text-xs text-blue-600/80 uppercase font-bold tracking-wider mb-1">Должность</p>
                                            <p className="font-bold text-lg text-blue-950 flex items-center gap-2">
                                                {employee.role === 'rf' ? 'Региональный менеджер / РФ' : 'Менеджер ПВЗ'}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                                                    <FileText className="h-3 w-3" /> Юрлицо
                                                </p>
                                                {!isEditingEmployer && (
                                                    <button 
                                                        onClick={() => { setIsEditingEmployer(true); setEditEmployerId(employee?.employer_id || ''); }}
                                                        className="text-[10px] text-primary hover:text-primary/80 font-semibold"
                                                    >
                                                        Изменить
                                                    </button>
                                                )}
                                            </div>
                                            {isEditingEmployer ? (
                                                <select 
                                                    value={editEmployerId} 
                                                    onChange={(e) => setEditEmployerId(e.target.value)}
                                                    className="w-full text-sm px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                                                >
                                                    <option value="">Выберите юрлицо...</option>
                                                    {employers.map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.name_full}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="font-semibold text-foreground bg-muted/30 p-2.5 rounded-lg border border-transparent">
                                                    {employee.employer_name || 'Не назначено'}
                                                </p>
                                            )}
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

