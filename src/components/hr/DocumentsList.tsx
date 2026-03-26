import { useState, useEffect, useCallback } from 'react';
import { api, type Document } from '@/services/api';
import { FileText, Loader2, Upload, Eye, Trash2, File, IdCard, Image, Award, Banknote, MapPin, Stethoscope, Plane, UserX } from 'lucide-react';
import { SigexSignModal } from '../SigexSignModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { cn } from '@/lib/utils';

interface DocumentsListProps {
    employeeId: string;
    employeeStatus: string;
    onStatusChange?: () => void;
}

const DOCUMENT_TYPES: any = {
    contract: { label: 'Трудовой договор', icon: FileText, color: 'blue', category: 'generated' },
    order_hiring: { label: 'Приказ о приеме', icon: FileText, color: 'emerald', category: 'generated' },
    application: { label: 'Заявление на прием', icon: FileText, color: 'amber', category: 'generated' },
    vacation_application: { label: 'Заявление на отпуск', icon: Plane, color: 'purple', category: 'generated' },
    vacation_order: { label: 'Приказ на отпуск', icon: Plane, color: 'purple', category: 'generated' },
    termination_order: { label: 'Приказ об увольнении', icon: UserX, color: 'red', category: 'generated' },
    employment_certificate: { label: 'Справка с места работы', icon: Award, color: 'slate', category: 'generated' },
    id_main: { label: 'Удостоверение личности (лиц.)', icon: IdCard, color: 'indigo', category: 'uploaded' },
    id_register: { label: 'Удостоверение личности (обор.)', icon: IdCard, color: 'indigo', category: 'uploaded' },
    id_scan: { label: 'Скан документа', icon: IdCard, color: 'indigo', category: 'uploaded' },
    photo: { label: 'Фотография 3×4', icon: Image, color: 'pink', category: 'uploaded' },
    cert_075: { label: 'Медсправка 075/у', icon: Stethoscope, color: 'green', category: 'uploaded' },
    cert_tb: { label: 'Справка тубдиспансер', icon: Stethoscope, color: 'green', category: 'uploaded' },
    bank_details: { label: 'Справка IBAN', icon: Banknote, color: 'emerald', category: 'uploaded' },
    address_cert: { label: 'Адресная справка', icon: MapPin, color: 'orange', category: 'uploaded' },
    other: { label: 'Другой документ', icon: File, color: 'gray', category: 'uploaded' }
};

export function DocumentsList({ employeeId, onStatusChange }: DocumentsListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ content: string; type: string; title: string } | null>(null);
    const [signingDoc, setSigningDoc] = useState<Document | null>(null);
    const [isIbanModalOpen, setIsIbanModalOpen] = useState(false);
    const [ibanInput, setIbanInput] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const loadDocuments = useCallback(async () => {
        try {
            const docs = await api.getDocuments(employeeId);
            setDocuments(docs);
        } catch (err) { console.error('Failed to load documents:', err); }
        finally { setIsLoading(false); }
    }, [employeeId]);

    useEffect(() => { loadDocuments(); }, [loadDocuments]);

    const handleGenerate = async (type: string, bypassModal = false) => {
        if (type === 'contract' && !bypassModal) { setIsIbanModalOpen(true); return; }
        setIsGenerating(type);
        try {
            const { content } = await api.generateDocument(employeeId, type, type === 'contract' ? ibanInput : undefined);
            const docConfig = DOCUMENT_TYPES[type] || { label: 'Документ' };
            setPreviewDoc({ content, type, title: docConfig.label });
            await loadDocuments();
            if (isIbanModalOpen) { setIsIbanModalOpen(false); setIbanInput(''); }
        } catch (err) { console.error('Failed to generate:', err); alert('Ошибка генерации'); }
        finally { setIsGenerating(null); }
    };

    const handleUpload = async () => {
        if (!selectedDocType || !pendingFile) { alert('Выберите тип и файл'); return; }
        setIsUploading(true);
        try {
            await api.uploadDocument(employeeId, selectedDocType, pendingFile);
            await loadDocuments();
            setShowUploadModal(false);
            setPendingFile(null);
            setSelectedDocType('');
        } catch (err) { console.error('Upload failed:', err); alert('Ошибка загрузки'); }
        finally { setIsUploading(false); }
    };

    const handleDelete = async (docId: string, docType: string) => {
        const docName = DOCUMENT_TYPES[docType]?.label || 'Документ';
        if (!confirm(`Удалить "${docName}"?`)) return;
        try { await api.deleteDocument(docId); await loadDocuments(); if (onStatusChange) onStatusChange(); }
        catch (err) { console.error(err); alert('Ошибка удаления'); }
    };

    const getStatusBadge = (doc: Document) => {
        if (doc.status === 'signed') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Подписан</span>;
        if (doc.status === 'draft') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Черновик</span>;
        if (doc.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Отклонен</span>;
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">На подписании</span>;
    };

    if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

    const generatedDocs = documents.filter(d => DOCUMENT_TYPES[d.type]?.category === 'generated');
    const uploadedDocs = documents.filter(d => DOCUMENT_TYPES[d.type]?.category === 'uploaded');

    return (
        <div className="space-y-6">
            {/* Generated Documents */}
            <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Сформированные документы</h3>
                <div className="space-y-2">
                    {generatedDocs.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4">Нет сформированных документов</p>
                    ) : (
                        generatedDocs.map(doc => {
                            const docConfig = DOCUMENT_TYPES[doc.type] || { label: doc.type, icon: FileText, color: 'gray' };
                            const Icon = docConfig.icon;
                            return (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", `bg-${docConfig.color}-50`)}>
                                            <Icon className={cn("h-5 w-5", `text-${docConfig.color}-600`)} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{docConfig.label}</p>
                                            <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString('ru-RU')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(doc)}
                                        <button onClick={() => setPreviewDoc({ content: '', type: doc.type, title: docConfig.label })} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Просмотр">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Uploaded Documents */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Загруженные документы</h3>
                    <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800">
                        <Upload className="h-3.5 w-3.5" /> Загрузить
                    </button>
                </div>
                <div className="space-y-2">
                    {uploadedDocs.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4">Нет загруженных документов</p>
                    ) : (
                        uploadedDocs.map(doc => {
                            const docConfig = DOCUMENT_TYPES[doc.type] || { label: doc.type, icon: File, color: 'gray' };
                            const Icon = docConfig.icon;
                            return (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", `bg-${docConfig.color}-50`)}>
                                            <Icon className={cn("h-5 w-5", `text-${docConfig.color}-600`)} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{docConfig.label}</p>
                                            <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString('ru-RU')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => window.open(doc.scan_url, '_blank')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Открыть">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(doc.id, doc.type)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Удалить">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Generate Buttons */}
            <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Сформировать документ</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                        { type: 'contract', label: 'Договор', color: 'blue' },
                        { type: 'order_hiring', label: 'Приказ', color: 'emerald' },
                        { type: 'application', label: 'Заявление', color: 'amber' },
                        { type: 'vacation_application', label: 'Отпуск', color: 'purple' }
                    ].map(btn => (
                        <button key={btn.type} onClick={() => handleGenerate(btn.type)} disabled={!!isGenerating} className={cn("flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all", isGenerating === btn.type ? `border-${btn.color}-300 bg-${btn.color}-50` : `border-slate-200 hover:border-${btn.color}-300 hover:bg-${btn.color}-50`)}>
                            {isGenerating === btn.type ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-lg">+</span>}
                            <span className="text-xs font-medium">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modals */}
            {isIbanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">IBAN для договора</h3>
                        <input type="text" value={ibanInput} onChange={e => setIbanInput(e.target.value)} placeholder="KZ..." className="w-full rounded-lg border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => { setIsIbanModalOpen(false); setIbanInput(''); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Отмена</button>
                            <button onClick={() => handleGenerate('contract', true)} disabled={!ibanInput.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50">Продолжить</button>
                        </div>
                    </div>
                </div>
            )}

            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Загрузка документа</h3>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Тип документа</label>
                        <select value={selectedDocType} onChange={e => setSelectedDocType(e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4">
                            <option value="">Выберите тип...</option>
                            <optgroup label="Удостоверение личности">
                                <option value="id_main">Удостоверение (лицевая сторона)</option>
                                <option value="id_register">Удостоверение (оборотная сторона)</option>
                                <option value="id_scan">Скан удостоверения</option>
                            </optgroup>
                            <optgroup label="Медицинские справки">
                                <option value="cert_075">Медсправка 075/у</option>
                                <option value="cert_tb">Справка тубдиспансер</option>
                            </optgroup>
                            <optgroup label="Банковские реквизиты">
                                <option value="bank_details">Справка IBAN</option>
                            </optgroup>
                            <optgroup label="Прочее">
                                <option value="photo">Фотография 3×4</option>
                                <option value="address_cert">Адресная справка</option>
                                <option value="other">Другой документ</option>
                            </optgroup>
                        </select>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Файл</label>
                        <input type="file" onChange={e => setPendingFile(e.target.files?.[0] || null)} className="w-full text-sm" accept=".pdf,.jpg,.jpeg,.png" />
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => { setShowUploadModal(false); setPendingFile(null); setSelectedDocType(''); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Отмена</button>
                            <button onClick={handleUpload} disabled={isUploading || !selectedDocType || !pendingFile} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50">{isUploading ? 'Загрузка...' : 'Загрузить'}</button>
                        </div>
                    </div>
                </div>
            )}

            {previewDoc && <DocumentPreviewModal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc.title} content={previewDoc.content} />}
            {signingDoc && <SigexSignModal documentId={signingDoc.id} documentTitle={DOCUMENT_TYPES[signingDoc.type]?.label || "Документ"} onClose={() => setSigningDoc(null)} onSuccess={() => { setSigningDoc(null); loadDocuments(); }} />}
        </div>
    );
}
