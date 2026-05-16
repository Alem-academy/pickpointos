import { useState } from 'react';
import { api } from '@/services/api';
import { X, ChevronRight, ChevronLeft, Loader2, CheckCircle2, FileText, Send, PenTool, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { SigexSignModal } from '../SigexSignModal';

interface TerminationWizardProps {
    employeeId: string;
    employeeName?: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface GeneratedDoc {
    type: string;
    document: any;
    content: string;
    success: boolean;
}

const DOC_TYPE_LABELS: Record<string, string> = {
    '11_soglashenie-o-rastorzhenii-trudovogo-dogovora': 'Соглашение о расторжении ТД',
};

const STEPS = [
    { label: 'Параметры', description: 'Укажите условия расторжения' },
    { label: 'Предпросмотр', description: 'Проверьте документ' },
    { label: 'Подписание', description: 'Отправьте на подпись' },
];

export function TerminationWizard({ employeeId, employeeName, onClose, onSuccess }: TerminationWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
    const [activePreview, setActivePreview] = useState<string | null>(null);
    const [employerSigningDocId, setEmployerSigningDocId] = useState<string | null>(null);
    const [signedDocIds, setSignedDocIds] = useState<string[]>([]);
    const [signingProgress, setSigningProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [params, setParams] = useState({
        terminationDate: '',
        lastWorkingDay: '',
        compensationAmount: '',
    });

    const handleParamChange = (key: string, value: string) => {
        setParams(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const validateStep = () => {
        if (currentStep === 0) {
            if (!params.terminationDate) {
                setError('Укажите дату расторжения');
                return false;
            }
            if (!params.lastWorkingDay) {
                setError('Укажите последний рабочий день');
                return false;
            }
        }
        return true;
    };

    const handleNext = async () => {
        if (!validateStep()) return;

        if (currentStep === 0) {
            const confirmed = window.confirm(
                'Будет сформировано соглашение о расторжении трудового договора.\n\nРанее сгенерированные документы останутся в системе. Продолжить?'
            );
            if (!confirmed) return;

            setIsGenerating(true);
            setError(null);
            try {
                const result = await api.generateProcessDocuments(employeeId, 'termination', {
                    terminationDate: params.terminationDate,
                    lastWorkingDay: params.lastWorkingDay,
                    compensationAmount: params.compensationAmount || undefined,
                });
                setGeneratedDocs(result.documents);
                if (result.errors && result.errors.length > 0) {
                    setError(`Ошибки: ${result.errors.map((e: any) => e.type).join(', ')}`);
                }
                setCurrentStep(1);
            } catch (err: any) {
                console.error('Generation failed:', err);
                setError(err.response?.data?.error || 'Ошибка генерации документа');
            } finally {
                setIsGenerating(false);
            }
        } else if (currentStep === 1) {
            setCurrentStep(2);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleSendToEmployee = async () => {
        setIsSubmitting(true);
        try {
            const doc = successfulDocs[0];
            if (!doc?.document?.id) return;
            const response = await fetch(`/api/documents/${doc.document.id}/signing-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                await navigator.clipboard.writeText(data.signingUrl);
                alert('✅ Ссылка на подпись скопирована!');
            }
        } catch (err) {
            console.error('Send failed:', err);
            alert('Ошибка отправки');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmployerSign = () => {
        const doc = successfulDocs[0];
        if (doc?.document?.id && !signedDocIds.includes(doc.document.id)) {
            setEmployerSigningDocId(doc.document.id);
        }
    };

    const handleEmployerSignSuccess = () => {
        const justSignedId = employerSigningDocId;
        if (justSignedId) {
            setSignedDocIds(prev => [...prev, justSignedId]);
        }
        setEmployerSigningDocId(null);
        setSigningProgress('✅ Документ подписан работодателем!');
        setTimeout(() => setSigningProgress(null), 3000);
    };

    const handleFinish = () => {
        onSuccess();
    };

    const successfulDocs = generatedDocs.filter(d => d.success);
    const isSignedByEmployer = successfulDocs[0]?.document?.id && signedDocIds.includes(successfulDocs[0].document.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Расторжение ТД {employeeName && <span className="text-slate-500 font-normal">— {employeeName}</span>}
                        </h2>
                        <p className="text-sm text-slate-500">Соглашение о расторжении трудового договора</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        {STEPS.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2 flex-1">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors",
                                    idx < currentStep ? "bg-emerald-100 text-emerald-700" :
                                    idx === currentStep ? "bg-primary text-white" :
                                    "bg-slate-200 text-slate-500"
                                )}>
                                    {idx < currentStep ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                </div>
                                <div className="hidden sm:block">
                                    <p className={cn("text-xs font-semibold", idx === currentStep ? "text-slate-900" : "text-slate-500")}>
                                        {step.label}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{step.description}</p>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={cn("flex-1 h-0.5 mx-2", idx < currentStep ? "bg-emerald-200" : "bg-slate-200")} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {currentStep === 0 && (
                        <div className="space-y-6 max-w-lg mx-auto">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 mb-3">
                                    <FileText className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">Условия расторжения</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Данные сотрудника и работодателя подставятся автоматически
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Дата расторжения <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={params.terminationDate}
                                        onChange={e => handleParamChange('terminationDate', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Последний рабочий день <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={params.lastWorkingDay}
                                        onChange={e => handleParamChange('lastWorkingDay', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Сумма компенсации (опционально)
                                    </label>
                                    <input
                                        type="text"
                                        value={params.compensationAmount}
                                        onChange={e => handleParamChange('compensationAmount', e.target.value)}
                                        placeholder="например, 150 000 ₸"
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Если не указать — компенсация не включается в соглашение</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-slate-900">Сгенерированный документ</h3>
                                <span className="text-xs text-slate-500">{successfulDocs.length} из 1</span>
                            </div>

                            <div className="space-y-4">
                                {successfulDocs.map((doc) => (
                                    <div key={doc.type} className="border border-slate-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setActivePreview(activePreview === doc.type ? null : doc.type)}
                                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-red-100">
                                                    <FileText className="h-5 w-5 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                                                    <p className="text-xs text-slate-500">{activePreview === doc.type ? 'Нажмите чтобы свернуть' : 'Нажмите чтобы развернуть предпросмотр'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">
                                                    {activePreview === doc.type ? 'Свернуть' : 'Развернуть'}
                                                </span>
                                                <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", activePreview === doc.type && "rotate-90")} />
                                            </div>
                                        </button>
                                        {activePreview === doc.type && (
                                            <div className="border-t border-slate-100 bg-slate-50/50">
                                                <div className="p-4">
                                                    <iframe
                                                        srcDoc={doc.content}
                                                        className="w-full h-96 border border-slate-200 rounded-lg bg-white"
                                                        title={DOC_TYPE_LABELS[doc.type] || doc.type}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 max-w-lg mx-auto">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">Документ готов</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Выберите способ подписания
                                </p>
                            </div>

                            {signingProgress && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 animate-pulse">
                                    {signingProgress}
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={handleSendToEmployee}
                                    disabled={isSubmitting}
                                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left"
                                >
                                    <div className="p-2 rounded-lg bg-purple-100">
                                        <Send className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Отправить сотруднику (eGov QR)</p>
                                        <p className="text-xs text-slate-500">Сгенерировать ссылку для подписания через мобильное приложение</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                </button>

                                <button
                                    onClick={handleEmployerSign}
                                    disabled={isSignedByEmployer}
                                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <PenTool className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {isSignedByEmployer ? 'Документ подписан работодателем' : 'Подписать как работодатель'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {isSignedByEmployer ? 'Подписано через NCALayer' : 'Через NCALayer'}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isGenerating}
                        className={cn(currentStep === 0 && "invisible")}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Назад
                    </Button>

                    {currentStep < 2 ? (
                        <Button
                            onClick={handleNext}
                            disabled={isGenerating}
                            className="min-w-[140px]"
                        >
                            {isGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <ChevronRight className="h-4 w-4 mr-1" />
                            )}
                            {isGenerating ? 'Генерация...' : currentStep === 0 ? 'Сформировать' : 'Далее'}
                        </Button>
                    ) : (
                        <Button onClick={handleFinish} variant="default" className="min-w-[140px]">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Готово
                        </Button>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {activePreview && (
                <DocumentPreviewModal
                    isOpen={!!activePreview}
                    onClose={() => setActivePreview(null)}
                    title={DOC_TYPE_LABELS[activePreview] || activePreview}
                    content={successfulDocs.find(d => d.type === activePreview)?.content || ''}
                />
            )}

            {/* Employer Signing Modal */}
            {employerSigningDocId && (
                <SigexSignModal
                    documentId={employerSigningDocId}
                    documentTitle={(() => {
                        const doc = successfulDocs.find(d => d.document?.id === employerSigningDocId);
                        return doc ? (DOC_TYPE_LABELS[doc.type] || "Документ") : "Документ";
                    })()}
                    onClose={() => setEmployerSigningDocId(null)}
                    onSuccess={handleEmployerSignSuccess}
                    signingRole="employer"
                />
            )}
        </div>
    );
}
