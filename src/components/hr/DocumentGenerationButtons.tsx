import { FileText, FileCheck, FileEdit, Plane, Loader2 } from 'lucide-react';

interface DocumentGenerationButtonsProps {
    onGenerate: (type: 'contract' | 'order_hiring' | 'application' | 'vacation_application') => void;
    isGenerating: string | null;
}

export function DocumentGenerationButtons({ onGenerate, isGenerating }: DocumentGenerationButtonsProps) {
    return (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Сгенерировать документ</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                    onClick={() => onGenerate('contract')}
                    disabled={!!isGenerating}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isGenerating === 'contract' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    ) : (
                        <FileText className="h-6 w-6 text-blue-600" />
                    )}
                    <span className="text-xs font-semibold text-blue-700 text-center">Договор</span>
                </button>

                <button
                    onClick={() => onGenerate('order_hiring')}
                    disabled={!!isGenerating}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isGenerating === 'order_hiring' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    ) : (
                        <FileCheck className="h-6 w-6 text-emerald-600" />
                    )}
                    <span className="text-xs font-semibold text-emerald-700 text-center">Приказ о приеме</span>
                </button>

                <button
                    onClick={() => onGenerate('application')}
                    disabled={!!isGenerating}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isGenerating === 'application' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                    ) : (
                        <FileEdit className="h-6 w-6 text-amber-600" />
                    )}
                    <span className="text-xs font-semibold text-amber-700 text-center">Заявление</span>
                </button>

                <button
                    onClick={() => onGenerate('vacation_application')}
                    disabled={!!isGenerating}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isGenerating === 'vacation_application' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    ) : (
                        <Plane className="h-6 w-6 text-purple-600" />
                    )}
                    <span className="text-xs font-semibold text-purple-700 text-center">Отпуск</span>
                </button>
            </div>
        </div>
    );
}
