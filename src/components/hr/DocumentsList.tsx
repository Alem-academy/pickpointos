import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type Document } from '@/services/api';
import { FileText, Loader2, PenTool, CheckCircle, Plus, Upload, Eye } from 'lucide-react';
import { SigexSignModal } from '../SigexSignModal';

interface DocumentsListProps {
    employeeId: string;
    employeeStatus: string;
    onStatusChange?: () => void;
}

export function DocumentsList({ employeeId, onStatusChange }: DocumentsListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState<string | null>(null); // 'contract' | 'order' | null
    const [isUploading, setIsUploading] = useState(false);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [signingDoc, setSigningDoc] = useState<Document | null>(null);

    // File upload ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocuments = useCallback(async () => {
        try {
            const docs = await api.getDocuments(employeeId);
            setDocuments(docs);
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setIsLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleGenerate = async (type: 'contract' | 'order') => {
        setIsGenerating(type);
        try {
            const { content } = await api.generateDocument(employeeId, type);
            setPreviewContent(content);
            await loadDocuments();
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

    const handlePreview = (doc: Document) => {
        if (doc.scan_url) {
            if (doc.scan_url.endsWith('.pdf')) {
                window.open(doc.scan_url, '_blank');
            } else {
                setPreviewUrl(doc.scan_url);
            }
        }
    };

    if (isLoading) return <div className="py-4 text-center text-muted-foreground">Загрузка документов...</div>;

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
                </div>
            </div>

            <div className="space-y-3">
                {documents.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        Нет документов. Нажмите "Сформировать ТД" для начала процесса оформления.
                    </div>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between rounded-lg border bg-background p-4">
                            <div className="flex items-center gap-3">
                                <div className={`rounded p-2 ${doc.status === 'signed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <div>
                                        <p className="font-medium">
                                            {doc.type === 'contract' ? 'Трудовой договор' :
                                                doc.type === 'order' ? 'Приказ о приеме' :
                                                    doc.type === 'id_scan' ? 'Скан удостоверения' :
                                                        'Документ'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Создан {new Date(doc.created_at).toLocaleDateString()} •
                                            Статус: <span className="font-medium">{doc.status === 'signed' ? 'Подписан' : 'Черновик'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {doc.scan_url && (
                                    <button
                                        onClick={() => handlePreview(doc)}
                                        className="flex items-center gap-1 rounded bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Просмотр
                                    </button>
                                )}

                                {doc.status === 'draft' && (
                                    <button
                                        onClick={() => handleSignClick(doc)}
                                        className="flex items-center gap-1 rounded bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20"
                                    >
                                        <PenTool className="h-4 w-4" />
                                        Подписать (eGov)
                                    </button>
                                )}

                                {doc.status === 'signed' && (
                                    <div className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-emerald-600">
                                        <CheckCircle className="h-4 w-4" />
                                        Подписано
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
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

            {signingDoc && (
                <SigexSignModal
                    documentId={signingDoc.id}
                    documentTitle={signingDoc.type === 'contract' ? 'Трудовой договор' : 'Приказ о приеме'}
                    onClose={() => setSigningDoc(null)}
                    onSuccess={handleSignSuccess}
                />
            )}
        </div>
    );
}
