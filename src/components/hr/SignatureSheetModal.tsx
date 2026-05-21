import { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';

interface SignatureSheetModalProps {
    documentId: string;
    documentTitle: string;
    onClose: () => void;
}

interface SheetData {
    signature_sheet_url: string | null;
    signature_sheet_generated_at: string | null;
    final_pdf_url: string | null;
}

export function SignatureSheetModal({ documentId, documentTitle, onClose }: SignatureSheetModalProps) {
    const [data, setData] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSheet = async () => {
        try {
            setLoading(true);
            setError(null);
            const sheetData = await api.getSignatureSheet(documentId);
            setData(sheetData);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setError(null);
            await api.generateSignatureSheet(documentId);
            await loadSheet();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Ошибка генерации');
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        loadSheet();
    }, [documentId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Лист подписей</h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Document name */}
                <p className="text-sm text-slate-600 mb-4 truncate" title={documentTitle}>
                    {documentTitle}
                </p>

                {/* Content */}
                <div className="min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-slate-500">Загрузка...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <p className="text-red-600 text-sm text-center">{error}</p>
                            <button
                                onClick={loadSheet}
                                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                            >
                                <RefreshCw className="h-3.5 w-3.5" /> Повторить
                            </button>
                        </div>
                    ) : data?.signature_sheet_url ? (
                        <div className="space-y-4">
                            {/* Success state */}
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-800">Лист подписей создан</p>
                                    {data.signature_sheet_generated_at && (
                                        <p className="text-xs text-emerald-600">
                                            {new Date(data.signature_sheet_generated_at).toLocaleString('ru-RU')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Download links */}
                            <div className="space-y-2">
                                <a
                                    href={data.signature_sheet_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-primary/5 transition-colors"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">Лист подписей</p>
                                        <p className="text-xs text-slate-500 truncate">Отдельный документ с данными ЭЦП</p>
                                    </div>
                                    <Download className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                </a>

                                {data.final_pdf_url && data.final_pdf_url !== data.signature_sheet_url && (
                                    <a
                                        href={data.final_pdf_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900">Финальный PDF</p>
                                            <p className="text-xs text-slate-500 truncate">Оригинальный документ + лист подписей</p>
                                        </div>
                                        <Download className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    </a>
                                )}
                            </div>

                            {/* Regenerate button */}
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full flex items-center justify-center gap-2 p-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Генерация...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4" />
                                        Пересоздать лист подписей
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">Лист подписей ещё не создан</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Создаётся автоматически при подписании обеими сторонами
                                </p>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Генерация...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4" />
                                        Создать лист подписей
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
