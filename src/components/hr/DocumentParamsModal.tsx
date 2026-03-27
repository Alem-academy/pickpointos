import { useState } from 'react';
import { X, Calendar, Banknote, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DocumentType = 'vacation_order' | 'vacation_application' | 'termination_order' | 'employment_certificate';

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

interface DocumentParamsModalProps {
    isOpen: boolean;
    documentType: DocumentType | null;
    onClose: () => void;
    onConfirm: (data: any) => void;
}

export function DocumentParamsModal({ isOpen, documentType, onClose, onConfirm }: DocumentParamsModalProps) {
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
        }
    };

    const getTitle = () => {
        switch (documentType) {
            case 'vacation_order': return '📄 Приказ на отпуск';
            case 'vacation_application': return '✉️ Заявление на отпуск';
            case 'termination_order': return '📄 Приказ об увольнении';
            case 'employment_certificate': return '📋 Справка с места работы';
        }
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

                    {/* Vacation Fields */}
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

                    {/* Termination Fields */}
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

                    {/* Certificate Fields */}
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
