import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type Document } from '@/services/api';
import { FileText, Loader2, PenTool, CheckCircle, Plus, Upload, Eye, Image, XCircle, Trash2, Briefcase, Plane, Award, UserX } from 'lucide-react';
import { SigexSignModal } from '../SigexSignModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
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
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ content: string; type: string; title: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [signingDoc, setSigningDoc] = useState<Document | null>(null);
    const [employerName, setEmployerName] = useState('');

    // IBAN Modal State
    const [isIbanModalOpen, setIsIbanModalOpen] = useState(false);
    const [ibanInput, setIbanInput] = useState('');

    const [isRejecting, setIsRejecting] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<string>('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);

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

    // Load employer info
    useEffect(() => {
        api.getEmployee(employeeId).then(emp => {
            setEmployerName(emp.employer_name || 'ИП «Жасмин» (по умолчанию)');
        }).catch(console.error);
    }, [employeeId]);


    const handleGenerate = async (type: 'contract' | 'order_hiring' | 'application' | 'vacation_application' | 'vacation_order' | 'termination_order' | 'employment_certificate', bypassModal = false) => {
        if (type === 'contract' && !bypassModal) {
            setIsIbanModalOpen(true);
            return;
        }

        setIsGenerating(type);
        try {
            const docType = type === 'order_hiring' ? 'order_hiring' : type;
            const { content } = await api.generateDocument(employeeId, docType, type === 'contract' ? ibanInput : undefined);
            
            // Show preview with new modal
            const docTitle = type === 'contract' ? 'Трудовой договор' : type === 'order_hiring' ? 'Приказ о приеме' : type === 'application' ? 'Заявление на прием' : type === 'vacation_application' ? 'Заявление на отпуск' : type === 'vacation_order' ? 'Приказ на отпуск' : type === 'termination_order' ? 'Приказ об увольнении' : 'Документ';
            setPreviewDoc({ content, type: docType, title: docTitle });
            
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
        // Open modal to select document type first
        setShowUploadModal(true);
        setSelectedDocType(''); // Reset selection
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Store file temporarily, will upload after type is confirmed
        setPendingFile(file);
    };

    const handleConfirmUpload = async () => {
        if (!selectedDocType) {
            alert('Пожалуйста, выберите тип документа');
            return;
        }
        if (!pendingFile) {
            alert('Пожалуйста, выберите файл');
            return;
        }

        setIsUploading(true);
        try {
            await api.uploadDocument(employeeId, selectedDocType, pendingFile);
            await loadDocuments();
            setShowUploadModal(false);
            setPendingFile(null);
            setSelectedDocType('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Ошибка загрузки файла');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelUpload = () => {
        setShowUploadModal(false);
        setPendingFile(null);
        setSelectedDocType('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteDocument = async (docId: string, docType: string) => {
        const docName = docType === 'id_main' ? 'Уд. личности (Лиц.)' :
                       docType === 'id_register' ? 'Уд. личности (Оборот)' :
                       docType === 'photo' ? 'Фото 3х4' :
                       docType === 'cert_075' ? 'Справка 075/у' :
                       docType === 'bank_details' ? 'Справка IBAN' :
                       docType === 'cert_tb' ? 'Справка тубдиспансер' :
                       docType === 'address_cert' ? 'Адресная справка' :
                       'Документ';
        
        if (!confirm(`Вы уверены, что хотите удалить "${docName}"? Это действие нельзя отменить.`)) {
            return;
        }

        try {
            await api.deleteDocument(docId);
            await loadDocuments();
            if (onStatusChange) onStatusChange();
        } catch (err) {
            console.error('Failed to delete document', err);
            alert('Не удалось удалить документ');
        }
    };

    const handleSignClick = (doc: Document) => {
        setSigningDoc(doc);
    };

    const handleSignSuccess = async () => {
        await loadDocuments();
        if (onStatusChange) onStatusChange();
    };

    const handleRejectDocument = async (docId: string) => {
        setRejectingDocId(docId);
        setShowRejectModal(true);
    };

    const confirmRejectDocument = async () => {
        if (!rejectReason.trim()) {
            alert('Пожалуйста, укажите причину отклонения');
            return;
        }
        
        if (!rejectingDocId) return;
        
        setIsRejecting(rejectingDocId);
        setShowRejectModal(false);
        
        try {
            await api.deleteDocument(rejectingDocId);
            await api.updateEmployeeStatus(employeeId, 'revision', rejectReason);
            await loadDocuments();
            if (onStatusChange) onStatusChange();
            setRejectReason('');
        } catch (err) {
            console.error('Failed to reject document', err);
            alert('Не удалось отклонить документ');
        } finally {
            setIsRejecting(null);
            setRejectingDocId(null);
        }
    };

    const handlePreview = async (doc: Document) => {
        // Always fetch content via API for HTML documents
        if (['contract', 'order_hiring', 'application', 'vacation_application', 'vacation_order', 'termination_order', 'employment_certificate'].includes(doc.type)) {
            try {
                const res = await api.getDocumentContent(doc.id);
                const docType = doc.type as string;
                const docTitle = docType === 'contract' ? 'Трудовой договор' 
                    : docType === 'order' || docType === 'order_hiring' ? 'Приказ о приеме' 
                    : docType === 'application' ? 'Заявление на прием'
                    : docType === 'vacation_application' ? 'Заявление на отпуск'
                    : docType === 'vacation_order' ? 'Приказ на отпуск'
                    : docType === 'termination_order' ? 'Приказ об увольнении'
                    : 'Документ';
                
                if (res.content) {
                    // Backend returned content directly
                    setPreviewDoc({ content: res.content, type: doc.type, title: docTitle });
                } else if (res.scan_url) {
                    // Fallback: fetch from URL
                    const r = await fetch(res.scan_url);
                    const html = await r.text();
                    setPreviewDoc({ content: html, type: doc.type, title: docTitle });
                } else {
                    alert('Документ не найден или пуст');
                }
            } catch (err) {
                console.error('Could not fetch document content', err);
                alert('Ошибка загрузки документа: ' + (err as Error).message);
            }
        } else if (doc.scan_url) {
            // For uploaded scans (ID cards, photos, etc.)
            const urlPath = doc.scan_url.split('?')[0];
            if (/\.pdf$/i.test(urlPath)) {
                window.open(doc.scan_url, '_blank');
            } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(urlPath)) {
                setPreviewUrl(doc.scan_url);
            } else {
                // Unknown type, try to open in new tab
                window.open(doc.scan_url, '_blank');
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
            {/* Employer Badge */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Юрлицо для документов</p>
                    <p className="text-sm font-medium text-blue-900">{employerName}</p>
                </div>
            </div>

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
                        onChange={handleFileSelect}
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
                        onClick={() => handleGenerate('order_hiring')}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                        {isGenerating === 'order_hiring' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
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

                    {/* Vacation and other document buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={() => handleGenerate('vacation_application')}
                            disabled={!!isGenerating}
                            className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                        >
                            {isGenerating === 'vacation_application' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plane className="h-4 w-4" />}
                            Заявление на отпуск
                        </button>
                        <button
                            onClick={() => handleGenerate('vacation_order')}
                            disabled={!!isGenerating}
                            className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                        >
                            {isGenerating === 'vacation_order' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                            Приказ на отпуск
                        </button>
                        <button
                            onClick={() => handleGenerate('employment_certificate')}
                            disabled={!!isGenerating}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                            {isGenerating === 'employment_certificate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                            Справка с места работы
                        </button>
                        <button
                            onClick={() => handleGenerate('termination_order')}
                            disabled={!!isGenerating}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                            {isGenerating === 'termination_order' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                            Приказ об увольнении
                        </button>
                    </div>
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
                                            {doc.type === 'contract' || doc.type === 'order_hiring' || doc.type === 'application'
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
                                                doc.type === 'order_hiring' ? 'Приказ о приеме' :
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

                                        {doc.status !== 'signed' && doc.type !== 'contract' && doc.type !== 'order_hiring' && doc.type !== 'application' && (
                                            <button
                                                onClick={() => handleRejectDocument(doc.id)}
                                                disabled={isRejecting === doc.id}
                                                className="flex flex-1 justify-center items-center gap-1 rounded bg-red-50 text-red-600 px-2 py-1.5 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                                title="Отклонить документ (отправить на доработку)"
                                            >
                                                {isRejecting === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                                Отклонить
                                            </button>
                                        )}

                                        {/* Delete Button - Show for ALL documents in DRAFT status (not signed) */}
                                        {doc.status === 'draft' && (
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id, doc.type)}
                                                className="flex flex-1 justify-center items-center gap-1 rounded bg-red-50 text-red-600 px-2 py-1.5 text-xs font-medium hover:bg-red-100 transition-colors"
                                                title="Удалить документ"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Удалить
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

            {/* Document Preview Modal */}
            {previewDoc && (
                <DocumentPreviewModal
                    isOpen={!!previewDoc}
                    onClose={() => setPreviewDoc(null)}
                    title={previewDoc.title}
                    content={previewDoc.content}
                    documentType={previewDoc.type}
                />
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

            {/* Upload Document Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-lg">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                                <Upload className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Загрузка документа</h3>
                                <p className="text-sm text-muted-foreground">Выберите тип и загрузите файл</p>
                            </div>
                        </div>

                        {/* Document Type Selection */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold mb-2 block">Тип документа *</label>
                            <select
                                value={selectedDocType}
                                onChange={(e) => setSelectedDocType(e.target.value)}
                                className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Выберите тип...</option>
                                <option value="id_main">Уд. личности (Лицевая сторона)</option>
                                <option value="id_register">Уд. личности (Оборотная сторона)</option>
                                <option value="photo">Фото 3х4</option>
                                <option value="cert_075">Справка 075/у (Мед. справка)</option>
                                <option value="bank_details">Справка IBAN</option>
                                <option value="cert_tb">Справка тубдиспансер</option>
                                <option value="address_cert">Адресная справка</option>
                                <option value="other">Другое</option>
                            </select>
                        </div>

                        {/* File Upload */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold mb-2 block">Файл *</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
                                    accept="application/pdf,image/*"
                                    onChange={handleFileSelect}
                                />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Поддерживаются: PDF, JPG, PNG, WEBP
                            </p>
                            {pendingFile && (
                                <div className="mt-2 flex items-center gap-2 rounded bg-blue-50 p-2 text-xs text-blue-700">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">{pendingFile.name}</span>
                                    <span className="text-muted-foreground">
                                        ({(pendingFile.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 border-t pt-6">
                            <button
                                onClick={handleCancelUpload}
                                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={!selectedDocType || !pendingFile || isUploading}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <><Loader2 className="inline h-4 w-4 animate-spin" /> Загрузка...</>
                                ) : (
                                    <><Upload className="inline h-4 w-4" /> Загрузить</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold">Причина отклонения</h3>
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Укажите причину, по которой документ отправляется на доработку. Сотрудник увидит это пояснение.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[120px] w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Например: Фото смазанное, нужно переделать. Или: Документ не читается..."
                            autoFocus
                        />
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectingDocId(null); }}
                                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                                disabled={isRejecting !== null}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={confirmRejectDocument}
                                disabled={!rejectReason.trim() || isRejecting !== null}
                                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                            >
                                {isRejecting !== null ? (
                                    <><Loader2 className="inline h-4 w-4 animate-spin" /> Отправка...</>
                                ) : (
                                    'Отклонить документ'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
