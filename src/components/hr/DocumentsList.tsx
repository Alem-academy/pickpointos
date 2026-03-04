import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type Document } from '@/services/api';
import { FileText, Loader2, PenTool, CheckCircle, Plus, Upload, Eye, Image } from 'lucide-react';
import { SigexSignModal } from '../SigexSignModal';
import { cn } from '@/lib/utils';

interface DocumentsListProps {
    employeeId: string;
    employeeStatus: string;
    onStatusChange?: () => void;
}

export function DocumentsList({ employeeId, onStatusChange }: DocumentsListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null); // 'contract' | 'order' | 'application' | null
    const [isUploading, setIsUploading] = useState(false);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [signingDoc, setSigningDoc] = useState<Document | null>(null);

    // IBAN Modal State
    const [isIbanModalOpen, setIsIbanModalOpen] = useState(false);
    const [ibanInput, setIbanInput] = useState('');

    // File upload ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocuments = useCallback(async () => {
        setLoadError(null);
        try {
            const docs = await api.getDocuments(employeeId);
            setDocuments(docs);
        } catch (err: any) {
            console.error('Failed to load documents:', err);
            setLoadError(err?.response?.data?.error || err?.message || 'Ошибка загрузки документов');
        } finally {
            setIsLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleGenerate = async (type: 'contract' | 'order' | 'application', bypassModal = false) => {
        if (type === 'contract' && !bypassModal) {
            setIsIbanModalOpen(true);
            return;
        }

        setIsGenerating(type);
        try {
            const { content } = await api.generateDocument(employeeId, type, type === 'contract' ? ibanInput : undefined);
            setPreviewContent(content);
            await loadDocuments();
            if (isIbanModalOpen) {
                setIsIbanModalOpen(false);
                setIbanInput('');
            }
        } catch (err) {
            console.error('Failed to generate document:', err);
            alert('Ошибка при генерации документа');
        } finally {
            setIsGenerating(null);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';

        setIsUploading(true);
        try {
            // Assume uploading generic 'other' doc for now, or 'id_scan' if explicit button
            await api.uploadDocument(employeeId, 'id_scan', file);
            await loadDocuments();
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Ошибка загрузки файла');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSignClick = (doc: Document) => {
        setSigningDoc(doc);
    };

    const handleSignSuccess = async () => {
        await loadDocuments();
        if (onStatusChange) onStatusChange();
    };

    const handlePreview = async (doc: Document) => {
        if (doc.scan_url) {
            // Strip S3 query params before checking extension
            const urlPath = doc.scan_url.split('?')[0];
            if (/\.pdf$/i.test(urlPath)) {
                window.open(doc.scan_url, '_blank');
            } else {
                setPreviewUrl(doc.scan_url);
            }
        } else if (['contract', 'order_hiring', 'application'].includes(doc.type)) {
            // Generated doc saved as HTML — fetch its content from backend
            try {
                const res = await api.getDocumentContent(doc.id);
                if (res.scan_url) {
                    // It's now stored as HTML file — open inline
                    const r = await fetch(res.scan_url);
                    const html = await r.text();
                    setPreviewContent(html);
                } else if (res.content) {
                    setPreviewContent(res.content);
                }
            } catch (err) {
                console.error('Could not fetch document content', err);
            }
        }
    };

    if (isLoading) return <div className="py-4 text-center text-muted-foreground">Загрузка документов...</div>;
    if (loadError) return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">Ошибка загрузки документов</p>
            <p className="mt-1 text-xs text-red-500">{loadError}</p>
            <button onClick={loadDocuments} className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Повторить</button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Документы сотрудника</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Загрузить скан
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                    />

                    <button
                        onClick={() => handleGenerate('contract')}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isGenerating === 'contract' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Трудовой договор
                    </button>
                    <button
                        onClick={() => handleGenerate('order')}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                        {isGenerating === 'order' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Приказ о приеме
                    </button>
                    <button
                        onClick={() => handleGenerate('application')}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                        {isGenerating === 'application' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Заявление
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {documents.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        Нет документов. Нажмите "Сформировать ТД" для начала процесса оформления.
                    </div>
                ) : (
                    documents.map(doc => {
                        // Strip query params from URL before checking extension
                        // S3 pre-signed URLs look like: https://.../file.jpg?X-Amz-...
                        const urlPath = doc.scan_url ? doc.scan_url.split('?')[0] : '';
                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(urlPath);
                        // Use dedicated thumbnail URL if backend provides one, otherwise fall back to full image
                        const thumbSrc = doc.thumbnail_url || doc.scan_url;

                        return (
                            <div key={doc.id} className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                                {/* Thumbnail Header */}
                                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden border-b">
                                    {isImage ? (
                                        <img
                                            src={thumbSrc!}
                                            alt={doc.type}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">
                                            {doc.type === 'contract' || doc.type === 'order' || doc.type === 'application'
                                                ? <FileText className="h-12 w-12 opacity-50" />
                                                : <Image className="h-12 w-12 opacity-50" />
                                            }
                                        </div>
                                    )}
                                    <div className="absolute right-2 top-2">
                                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold shadow-sm backdrop-blur-md",
                                            doc.status === 'signed' ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-slate-700'
                                        )}>
                                            {doc.status === 'signed' ? 'Подписан' : 'Черновик'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-4">
                                    <div className="mb-2">
                                        <h4 className="font-bold text-sm leading-tight line-clamp-2">
                                            {doc.type === 'contract' ? 'Трудовой договор' :
                                                doc.type === 'order' ? 'Приказ о приеме' :
                                                    doc.type === 'application' ? 'Заявление на прием' :
                                                        doc.type === 'id_main' ? 'Уд. личности (Лиц.)' :
                                                            doc.type === 'id_register' ? 'Уд. личности (Оборот)' :
                                                                doc.type === 'cert_075' ? 'Справка 075/у' :
                                                                    doc.type === 'photo' ? 'Фото 3х4' :
                                                                        doc.type === 'bank_details' ? 'Справка IBAN' :
                                                                            doc.type === 'cert_tb' ? 'Справка тубдиспансер' :
                                                                                doc.type === 'address_cert' ? 'Адресная справка' :
                                                                                    'Документ'}
                                        </h4>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto pt-3 flex flex-wrap items-center gap-2 border-t">
                                        {(doc.scan_url || ['contract', 'order_hiring', 'application'].includes(doc.type)) && (
                                            <button
                                                onClick={() => handlePreview(doc)}
                                                className="flex flex-1 justify-center items-center gap-1 rounded bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Просмотр
                                            </button>
                                        )}

                                        {doc.status === 'draft' && (
                                            <button
                                                onClick={() => handleSignClick(doc)}
                                                className="flex flex-1 justify-center items-center gap-1 rounded bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                                            >
                                                <PenTool className="h-3.5 w-3.5" />
                                                Подписать
                                            </button>
                                        )}

                                        {doc.status === 'signed' && (
                                            <div className="flex w-full items-center justify-center gap-1 rounded bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-600">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                Подписано успешно
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {previewContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b p-4">
                            <h3 className="font-semibold">Предпросмотр документа</h3>
                            <button
                                onClick={() => setPreviewContent(null)}
                                className="rounded-full p-1 hover:bg-slate-100"
                            >
                                <span className="sr-only">Закрыть</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-8 bg-slate-50">
                            <div
                                className="mx-auto max-w-[210mm] min-h-[297mm] bg-white p-[20mm] shadow-sm text-sm"
                                dangerouslySetInnerHTML={{ __html: previewContent }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 border-t p-4">
                            <button
                                onClick={() => setPreviewContent(null)}
                                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                            >
                                Закрыть
                            </button>
                            <button
                                onClick={() => {
                                    // If we had the doc ID here we could sign it directly
                                    setPreviewContent(null);
                                }}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
                    <img src={previewUrl} alt="Preview" className="max-h-[90vh] max-w-full rounded shadow-2xl" />
                </div>
            )}

            {/* IBAN Modal — opens before contract generation */}
            {isIbanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="border-b p-6">
                            <h3 className="text-lg font-semibold">Введите IBAN сотрудника</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Для формирования Трудового Договора необходимо указать актуальный банковский IBAN (20 символов). Его можно найти в справке IBAN загруженной выше.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">IBAN</label>
                                <input
                                    type="text"
                                    value={ibanInput}
                                    onChange={(e) => setIbanInput(e.target.value.toUpperCase())}
                                    placeholder="KZ..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm uppercase tracking-widest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    maxLength={20}
                                    autoFocus
                                />
                                <p className="mt-1 text-right text-xs text-slate-400">{ibanInput.length} / 20</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t p-6">
                            <button
                                onClick={() => { setIsIbanModalOpen(false); setIbanInput(''); }}
                                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={() => handleGenerate('contract', true)}
                                disabled={ibanInput.length < 16 || !!isGenerating}
                                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isGenerating === 'contract' ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Генерация...</>
                                ) : (
                                    'Сформировать договор'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {signingDoc && (
                <SigexSignModal
                    documentId={signingDoc.id}
                    documentTitle={signingDoc.type === 'contract' ? 'Трудовой договор' : signingDoc.type === 'application' ? 'Заявление на прием' : 'Приказ о приеме'}
                    onClose={() => setSigningDoc(null)}
                    onSuccess={handleSignSuccess}
                />
            )}
        </div>
    );
}
