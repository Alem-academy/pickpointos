import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { FileText, UserPlus, Plane, Baby, UserX, RefreshCw, CheckCircle2, Clock, ChevronRight, PenTool, Send, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HiringWizard } from './HiringWizard';
import { TerminationWizard } from './TerminationWizard';
import { VacationWizard } from './VacationWizard';
import { MaternityReturnWizard } from './MaternityReturnWizard';
import { MaternityLeaveWizard } from './MaternityLeaveWizard';
import { NameChangeWizard } from './NameChangeWizard';

interface ProcessLauncherProps {
    employeeId: string;
    employeeName?: string;
    employeeStatus?: string;
    documents: Array<{ id: string; type: string; status: string; created_at: string; scan_url?: string }>;
    onDocumentsChange?: () => void;
}

interface ProcessInfo {
    key: string;
    label: string;
    description: string;
    documentCount: number;
    requiresEmployerSignature: boolean;
}

const PROCESS_ICONS: Record<string, React.ReactNode> = {
    hiring: <UserPlus className="h-5 w-5" />,
    vacation: <Plane className="h-5 w-5" />,
    termination: <UserX className="h-5 w-5" />,
    maternity_leave: <Baby className="h-5 w-5" />,
    maternity_return: <Baby className="h-5 w-5" />,
    name_change: <RefreshCw className="h-5 w-5" />,
    data_change: <RefreshCw className="h-5 w-5" />,
};

const PROCESS_COLORS: Record<string, string> = {
    hiring: 'blue',
    vacation: 'purple',
    termination: 'red',
    maternity_leave: 'pink',
    maternity_return: 'pink',
    name_change: 'orange',
    data_change: 'orange',
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; hoverBorder: string; hoverBg: string; cardBg: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', hoverBorder: 'hover:border-blue-300', hoverBg: 'hover:bg-blue-50', cardBg: 'bg-blue-50/30' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', hoverBorder: 'hover:border-purple-300', hoverBg: 'hover:bg-purple-50', cardBg: 'bg-purple-50/30' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200', hoverBorder: 'hover:border-red-300', hoverBg: 'hover:bg-red-50', cardBg: 'bg-red-50/30' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200', hoverBorder: 'hover:border-pink-300', hoverBg: 'hover:bg-pink-50', cardBg: 'bg-pink-50/30' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', hoverBorder: 'hover:border-orange-300', hoverBg: 'hover:bg-orange-50', cardBg: 'bg-orange-50/30' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', hoverBorder: 'hover:border-slate-300', hoverBg: 'hover:bg-slate-50', cardBg: 'bg-slate-50/30' },
};

const DOC_TYPE_TO_PROCESS: Record<string, string> = {
    '13_zayavlenie-o-prieme-na-rabotu': 'hiring',
    '14_prikaz-o-prieme-na-rabotu': 'hiring',
    '15_trudovoy-dogovor': 'hiring',
    '16_zayavlenie-na-otpusk': 'vacation',
    '17_prikaz-ob-otpuske': 'vacation',
    'vacation_application': 'vacation',
    'vacation_order': 'vacation',
    '18_zayavlenie-na-uvolnenie': 'termination',
    '19_prikaz-ob-uvolnenii': 'termination',
    '11_soglashenie-o-rastorzhenii-trudovogo-dogovora': 'termination',
    'termination_order': 'termination',
    '09_zayavlenie-na-otpusk-po-beremennosti': 'maternity_leave',
    '04_prikaz-ob-otpuske-po-beremennosti-i-rodam': 'maternity_leave',
    '01_zayavlenie-o-vyhode-s-dekreta': 'maternity_return',
    '07_prikaz-o-vyhode-iz-otpuska-po-uhodu': 'maternity_return',
    '06_prikaz-o-vnesenii-izmeneniy-v-fio': 'name_change',
    '12_dop-soglashenie-ob-izmenenii-familii': 'name_change',
    '03_zayavlenie-ob-izmenenii-personalnyh-dannyh': 'data_change',
};

// Generic DB types that can belong to multiple processes (legacy documents)
const GENERIC_TYPE_TO_PROCESSES: Record<string, string[]> = {
    'employee_application': ['hiring', 'vacation', 'maternity_leave', 'maternity_return', 'name_change', 'data_change'],
    'employer_order': ['hiring', 'vacation', 'termination', 'maternity_leave', 'maternity_return', 'name_change'],
    'mutual_agreement': ['termination', 'name_change'],
    'generated': ['hiring', 'vacation', 'termination', 'maternity_leave', 'maternity_return', 'name_change', 'data_change'],
};

function typeBelongsToProcess(type: string, processKey: string): boolean {
    if (DOC_TYPE_TO_PROCESS[type] === processKey) return true;
    return GENERIC_TYPE_TO_PROCESSES[type]?.includes(processKey) || false;
}

function getProcessStatus(processKey: string, docs: ProcessLauncherProps['documents']) {
    const processDocs = docs.filter(d => typeBelongsToProcess(d.type, processKey));
    if (processDocs.length === 0) return 'not_started';

    const allSigned = processDocs.every(d => d.status === 'signed' || d.status === 'fully_signed');
    const anyPending = processDocs.some(d => d.status === 'draft' || d.status === 'sent_to_employee');
    const anyEmployeeSigned = processDocs.some(d => d.status === 'signed');
    const anyEmployerSigned = processDocs.some(d => d.status === 'employer_signed' || d.status === 'fully_signed');

    if (allSigned) return 'completed';
    if (anyEmployerSigned) return 'employer_signed';
    if (anyEmployeeSigned) return 'employee_signed';
    if (anyPending) return 'pending';
    return 'in_progress';
}

function StatusBadge({ status, count }: { status: string; count: number }) {
    const configs: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
        not_started: { text: 'Не начат', className: 'bg-slate-100 text-slate-500', icon: <Clock className="h-3 w-3" /> },
        pending: { text: `${count} док.`, className: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3 w-3" /> },
        in_progress: { text: 'В работе', className: 'bg-blue-100 text-blue-700', icon: <RefreshCw className="h-3 w-3" /> },
        employee_signed: { text: 'Ждёт работодателя', className: 'bg-purple-100 text-purple-700', icon: <CheckCircle2 className="h-3 w-3" /> },
        employer_signed: { text: 'Ждёт работника', className: 'bg-indigo-100 text-indigo-700', icon: <CheckCircle2 className="h-3 w-3" /> },
        completed: { text: 'Завершён', className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
    };
    const config = configs[status] || configs.not_started;

    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.className)}>
            {config.icon}
            {config.text}
        </span>
    );
}

export function ProcessLauncher({ employeeId, employeeName, documents, onDocumentsChange }: ProcessLauncherProps) {
    const [processes, setProcesses] = useState<ProcessInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeWizard, setActiveWizard] = useState<string | null>(null);
    const [wizardDocs, setWizardDocs] = useState<Array<{ id: string; type: string; status: string }>>([]);

    const loadProcesses = useCallback(async () => {
        try {
            const data = await api.getProcesses();
            setProcesses(data);
        } catch (err) {
            console.error('Failed to load processes:', err);
            setProcesses([{
                key: 'hiring',
                label: 'Приём на работу',
                description: 'Пакет документов для оформления нового сотрудника',
                documentCount: 3,
                requiresEmployerSignature: true,
            }]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProcesses();
    }, [loadProcesses]);

    const handleWizardClose = () => {
        setActiveWizard(null);
        setWizardDocs([]);
        onDocumentsChange?.();
    };

    const openWizard = (processKey: string, processDocs: ProcessLauncherProps['documents']) => {
        setWizardDocs(processDocs.map(d => ({ id: d.id, type: d.type, status: d.status })));
        setActiveWizard(processKey === 'data_change' ? 'name_change' : processKey);
    };

    const handleProcessClick = (processKey: string) => {
        const processDocs = documents.filter(d => typeBelongsToProcess(d.type, processKey));
        openWizard(processKey, processDocs);
    };

    const handleQuickSign = (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        // Open signing modal directly for this document
        // For now, open the wizard with existing docs
        const doc = documents.find(d => d.id === docId);
        if (doc) {
            const processKey = DOC_TYPE_TO_PROCESS[doc.type] || GENERIC_TYPE_TO_PROCESSES[doc.type]?.[0];
            if (processKey) {
                const processDocs = documents.filter(d => typeBelongsToProcess(d.type, processKey));
                openWizard(processKey, processDocs);
            }
        }
    };

    const handleQuickSendLink = async (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        try {
            const response = await fetch(`/api/documents/${docId}/signing-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                await navigator.clipboard.writeText(data.signingUrl);
                alert('✅ Ссылка на подпись скопирована!');
            }
        } catch (err) {
            console.error('Failed to generate signing link:', err);
            alert('Ошибка генерации ссылки');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">HR Процессы</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Выберите процесс для быстрого оформления документов</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {processes.map((process) => {
                    const status = getProcessStatus(process.key, documents);
                    const colorKey = PROCESS_COLORS[process.key] || 'slate';
                    const colorCls = COLOR_CLASSES[colorKey] || COLOR_CLASSES.slate;
                    const icon = PROCESS_ICONS[process.key] || <FileText className="h-5 w-5" />;
                    const processDocs = documents.filter(d => typeBelongsToProcess(d.type, process.key));
                    const hasDocs = processDocs.length > 0;
                    const allSigned = hasDocs && processDocs.every(d => d.status === 'signed' || d.status === 'fully_signed');
                    const needsEmployerSign = hasDocs && processDocs.some(
                        d => d.status === 'draft' || (d.status === 'signed' && !d.status?.includes('employer'))
                    );

                    return (
                        <button
                            key={process.key}
                            onClick={() => handleProcessClick(process.key)}
                            className={cn(
                                "relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left hover:shadow-md group",
                                status === 'completed'
                                    ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300"
                                    : status === 'not_started'
                                        ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                        : `${colorCls.border} ${colorCls.cardBg} ${colorCls.hoverBorder}`
                            )}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className={cn("p-2 rounded-lg", colorCls.bg)}>
                                    <span className={cn("", colorCls.text)}>{icon}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </div>
                            <div className="w-full">
                                <p className="text-sm font-semibold text-slate-900">{process.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{process.description}</p>
                            </div>
                            <div className="flex items-center justify-between w-full mt-1">
                                <StatusBadge status={status} count={processDocs.length} />
                                {processDocs.length > 0 && (
                                    <span className="text-xs text-slate-400">{processDocs.length} док.</span>
                                )}
                            </div>

                            {/* Quick action buttons for existing unsigned docs */}
                            {hasDocs && !allSigned && (
                                <div className="flex items-center gap-1.5 w-full pt-2 border-t border-slate-100/50">
                                    {needsEmployerSign && (
                                        <>
                                            <button
                                                onClick={(e) => handleQuickSendLink(e, processDocs[0].id)}
                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                                            >
                                                <Send className="h-3 w-3" />
                                                Ссылка
                                            </button>
                                            <button
                                                onClick={(e) => handleQuickSign(e, processDocs[0].id)}
                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                            >
                                                <PenTool className="h-3 w-3" />
                                                Подписать
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleProcessClick(process.key); }}
                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors ml-auto"
                                    >
                                        <Eye className="h-3 w-3" />
                                        Открыть
                                    </button>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {activeWizard === 'hiring' && (
                <HiringWizard
                    employeeId={employeeId}
                    employeeName={employeeName}
                    existingDocuments={wizardDocs}
                    onClose={handleWizardClose}
                    onSuccess={handleWizardClose}
                />
            )}
            {activeWizard === 'termination' && (
                <TerminationWizard
                    employeeId={employeeId}
                    employeeName={employeeName}
                    existingDocuments={wizardDocs}
                    onClose={handleWizardClose}
                    onSuccess={handleWizardClose}
                />
            )}
            {activeWizard === 'vacation' && (
                <VacationWizard
                    employeeId={employeeId}
                    employeeName={employeeName}
                    existingDocuments={wizardDocs}
                    onClose={handleWizardClose}
                    onSuccess={handleWizardClose}
                />
            )}
            {activeWizard === 'maternity_return' && (
                <MaternityReturnWizard
                    employeeId={employeeId}
                    employeeName={employeeName}
                    existingDocuments={wizardDocs}
                    onClose={handleWizardClose}
                    onSuccess={handleWizardClose}
                />
            )}
            {activeWizard === 'maternity_leave' && (
                <MaternityLeaveWizard
                    employeeId={employeeId}
                    employeeName={employeeName}
                    existingDocuments={wizardDocs}
                    onClose={handleWizardClose}
                    onSuccess={handleWizardClose}
                />
            )}
            {activeWizard === 'name_change' && (
                <NameChangeWizard
                    employeeId={employeeId}
                    employeeName={employeeName}
                    existingDocuments={wizardDocs}
                    onClose={handleWizardClose}
                    onSuccess={handleWizardClose}
                />
            )}
        </div>
    );
}
