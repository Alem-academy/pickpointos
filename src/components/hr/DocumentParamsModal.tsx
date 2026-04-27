import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';

export type DocumentType = string;

interface TemplateVariable {
    type: string;
    description?: string;
    example?: string;
}

interface TemplateSchema {
    templateName: string;
    type: string;
    required: string[];
    variables: Record<string, TemplateVariable>;
}

interface DocumentParamsModalProps {
    isOpen: boolean;
    documentType: DocumentType | null;
    employeeData?: any;
    onClose: () => void;
    onConfirm: (data: any) => void;
}

// Legacy hardcoded forms for built-in types
interface VacationData {
    vacationDays: number;
    vacationStart: string;
    vacationEnd: string;
}

interface TerminationData {
    terminationDate: string;
    terminationReason: string;
    contractNumber: string;
    contractDate: string;
}

interface CertificateData {
    salary: string;
}

interface AddendumData {
    contractNumber: string;
    contractDate: string;
    changeTopic: string;
}

const LEGACY_TYPES = ['vacation_order', 'vacation_application', 'termination_order', 'employment_certificate', 'addendum'];

export function DocumentParamsModal({ isOpen, documentType, employeeData, onClose, onConfirm }: DocumentParamsModalProps) {
    const [schema, setSchema] = useState<TemplateSchema | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    // Legacy states
    const [vacationData, setVacationData] = useState<VacationData>({
        vacationDays: 14,
        vacationStart: '',
        vacationEnd: ''
    });
    const [terminationData, setTerminationData] = useState<TerminationData>({
        terminationDate: '',
        terminationReason: 'по собственному желанию',
        contractNumber: '',
        contractDate: ''
    });
    const [certificateData, setCertificateData] = useState<CertificateData>({
        salary: '85000'
    });
    const [addendumData, setAddendumData] = useState<AddendumData>({
        contractNumber: '',
        contractDate: '',
        changeTopic: ''
    });

    useEffect(() => {
        if (!isOpen || !documentType) return;

        if (LEGACY_TYPES.includes(documentType)) {
            setSchema(null);
            return;
        }

        setLoading(true);
        api.getTemplateSchema(documentType)
            .then((schema) => {
                setSchema(schema);
                // Pre-fill auto-known fields from employeeData
                const initial: Record<string, string> = {};
                if (schema?.variables && employeeData) {
                    for (const key of Object.keys(schema.variables)) {
                        if (key === 'employeeFullName' && employeeData.full_name) initial[key] = employeeData.full_name;
                        if (key === 'employeeIIN' && employeeData.iin) initial[key] = employeeData.iin;
                        if (key === 'employeePosition') initial[key] = employeeData.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ';
                        if (key === 'employeeAddress' && (employeeData.registered_address || employeeData.address)) {
                            initial[key] = employeeData.registered_address || employeeData.address;
                        }
                        if (key === 'employeePhone' && employeeData.phone) initial[key] = employeeData.phone;
                        if (key === 'employeeEmail' && employeeData.email) initial[key] = employeeData.email;
                        if (key === 'employeeIBAN' && employeeData.iban) initial[key] = employeeData.iban;
                        if (key === 'employeeIdCard' && employeeData.id_card_number) initial[key] = employeeData.id_card_number;
                        if (key === 'employeeIdCardIssuedBy' && employeeData.id_card_issued_by) initial[key] = employeeData.id_card_issued_by;
                        if (key === 'pvzAddress' && employeeData.pvz_address) initial[key] = employeeData.pvz_address;
                    }
                }
                setFormData(initial);
            })
            .catch(() => setSchema(null))
            .finally(() => setLoading(false));
    }, [isOpen, documentType, employeeData]);

    if (!isOpen || !documentType) return null;

    const handleSubmit = () => {
        switch (documentType) {
            case 'vacation_order':
            case 'vacation_application':
                if (!vacationData.vacationStart || !vacationData.vacationEnd) {
                    alert('Укажите даты отпуска');
                    return;
                }
                onConfirm(vacationData);
                break;

            case 'termination_order':
                if (!terminationData.terminationDate) {
                    alert('Укажите дату увольнения');
                    return;
                }
                onConfirm(terminationData);
                break;

            case 'employment_certificate':
                onConfirm(certificateData);
                break;

            case 'addendum':
                if (!addendumData.contractNumber || !addendumData.contractDate) {
                    alert('Укажите номер и дату договора');
                    return;
                }
                onConfirm(addendumData);
                break;

            default:
                // Dynamic form validation
                if (schema?.required) {
                    const missing = schema.required.filter(r => !formData[r] || formData[r].trim() === '' || formData[r] === '__________');
                    if (missing.length > 0) {
                        alert(`Заполните обязательные поля: ${missing.map(m => schema.variables[m]?.description || m).join(', ')}`);
                        return;
                    }
                }
                onConfirm(formData);
                break;
        }
    };

    const getTitle = () => {
        if (schema) return schema.templateName;
        switch (documentType) {
            case 'vacation_order': return '📄 Приказ на отпуск';
            case 'vacation_application': return '✉️ Заявление на отпуск';
            case 'termination_order': return '📄 Приказ об увольнении';
            case 'employment_certificate': return '📋 Справка с места работы';
            case 'addendum': return '📄 Дополнительное соглашение';
            default: return 'Документ';
        }
    };

    const renderDynamicForm = () => {
        if (!schema) return null;
        if (loading) return <div className="py-4 text-center text-sm text-slate-500">Загрузка формы...</div>;

        return (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {Object.entries(schema.variables).map(([key, def]) => {
                    const isRequired = schema.required?.includes(key);
                    const value = formData[key] || '';
                    const isAutoFilled = value && value !== '__________' && (
                        key.startsWith('employee') || key.startsWith('employer') || key.startsWith('pvz') || key.startsWith('currentDate')
                    );

                    return (
                        <div key={key} className="space-y-1">
                            <label className="text-sm font-semibold flex items-center gap-1">
                                {def.description || key}
                                {isRequired && <span className="text-red-500">*</span>}
                                {isAutoFilled && <span className="text-xs font-normal text-emerald-600">(авто)</span>}
                            </label>
                            <input
                                type={key.toLowerCase().includes('date') && !key.includes('Day') && !key.includes('Month') && !key.includes('Year') ? 'date' : 'text'}
                                value={value}
                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${isAutoFilled ? 'bg-emerald-50' : ''}`}
                                placeholder={def.example || ''}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{getTitle()}</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {/* Legacy Vacation Fields */}
                    {(documentType === 'vacation_order' || documentType === 'vacation_application') && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Дней отпуска</label>
                                <input
                                    type="number"
                                    value={vacationData.vacationDays}
                                    onChange={(e) => setVacationData({ ...vacationData, vacationDays: parseInt(e.target.value) || 14 })}
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    min="14"
                                    max="30"
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Дата начала</label>
                                    <input
                                        type="date"
                                        value={vacationData.vacationStart}
                                        onChange={(e) => setVacationData({ ...vacationData, vacationStart: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Дата окончания</label>
                                    <input
                                        type="date"
                                        value={vacationData.vacationEnd}
                                        onChange={(e) => setVacationData({ ...vacationData, vacationEnd: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Legacy Termination Fields */}
                    {documentType === 'termination_order' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Дата увольнения</label>
                                <input
                                    type="date"
                                    value={terminationData.terminationDate}
                                    onChange={(e) => setTerminationData({ ...terminationData, terminationDate: e.target.value })}
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Причина</label>
                                <select
                                    value={terminationData.terminationReason}
                                    onChange={(e) => setTerminationData({ ...terminationData, terminationReason: e.target.value })}
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="по собственному желанию">По собственному желанию</option>
                                    <option value="по соглашению сторон">По соглашению сторон</option>
                                    <option value="в связи с переходом на другую работу">В связи с переходом на другую работу</option>
                                    <option value="в связи с сокращением штата">В связи с сокращением штата</option>
                                </select>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">№ Договора</label>
                                    <input
                                        type="text"
                                        value={terminationData.contractNumber}
                                        onChange={(e) => setTerminationData({ ...terminationData, contractNumber: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="ТД-001/26"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Дата договора</label>
                                    <input
                                        type="date"
                                        value={terminationData.contractDate}
                                        onChange={(e) => setTerminationData({ ...terminationData, contractDate: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Legacy Certificate Fields */}
                    {documentType === 'employment_certificate' && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Зарплата (₸)</label>
                            <input
                                type="number"
                                value={certificateData.salary}
                                onChange={(e) => setCertificateData({ ...certificateData, salary: e.target.value })}
                                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="85000"
                            />
                            <p className="text-xs text-slate-500">Укажите среднюю месячную зарплату</p>
                        </div>
                    )}

                    {/* Legacy Addendum Fields */}
                    {documentType === 'addendum' && (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">№ Договора</label>
                                    <input
                                        type="text"
                                        value={addendumData.contractNumber}
                                        onChange={(e) => setAddendumData({ ...addendumData, contractNumber: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="ТД-001/26"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Дата договора</label>
                                    <input
                                        type="date"
                                        value={addendumData.contractDate}
                                        onChange={(e) => setAddendumData({ ...addendumData, contractDate: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Тема изменений</label>
                                <input
                                    type="text"
                                    value={addendumData.changeTopic}
                                    onChange={(e) => setAddendumData({ ...addendumData, changeTopic: e.target.value })}
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Изменение адреса ПВЗ, должности и т.д."
                                />
                            </div>
                        </>
                    )}

                    {/* Dynamic form for new templates */}
                    {documentType !== 'vacation_order' && documentType !== 'vacation_application' &&
                     documentType !== 'termination_order' && documentType !== 'employment_certificate' &&
                     documentType !== 'addendum' && renderDynamicForm()}
                </div>

                {/* Footer */}
                <div className="mt-6 flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Отмена
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1 bg-primary text-white">
                        Сформировать
                    </Button>
                </div>
            </div>
        </div>
    );
}
