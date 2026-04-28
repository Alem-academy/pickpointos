import { useState, useEffect, useCallback } from 'react';
import { api, type Document } from '@/services/api';
import { FileText, Loader2, Upload, Eye, Trash2, File, IdCard, Image, Award, Banknote, MapPin, Stethoscope, Plane, UserX, CheckCircle, Share2, PenTool } from 'lucide-react';
import { SigexSignModal } from '../SigexSignModal';
import { SignatureSheetModal } from './SignatureSheetModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentParamsModal, type DocumentType } from './DocumentParamsModal';
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
    addendum: { label: 'Доп. соглашение', icon: FileText, color: 'indigo', category: 'generated' },
    // Maternity / Childcare documents
    '01_zayavlenie-o-vyhode-s-dekreta': { label: 'Заявление о выходе с декрета', icon: FileText, color: 'pink', category: 'maternity' },
    '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom': { label: 'Заявление на отпуск по уходу', icon: FileText, color: 'pink', category: 'maternity' },
    '03_zayavlenie-ob-izmenenii-personalnyh-dannyh': { label: 'Заявление об изменении данных', icon: FileText, color: 'orange', category: 'hr_change' },
    '04_prikaz-ob-otpuske-po-beremennosti-i-rodam': { label: 'Приказ об отпуске по беременности', icon: FileText, color: 'pink', category: 'maternity' },
    '05_prikaz-o-prodlenii-otpuska-po-beremennosti': { label: 'Приказ о продлении отпуска', icon: FileText, color: 'pink', category: 'maternity' },
    '06_prikaz-o-vnesenii-izmeneniy-v-fio': { label: 'Приказ об изменении ФИО', icon: FileText, color: 'orange', category: 'hr_change' },
    '07_prikaz-o-vyhode-iz-otpuska-po-uhodu': { label: 'Приказ о выходе из отпуска', icon: FileText, color: 'pink', category: 'maternity' },
    '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu': { label: 'Приказ об отпуске без ЗП', icon: FileText, color: 'pink', category: 'maternity' },
    '09_zayavlenie-na-otpusk-po-beremennosti': { label: 'Заявление на отпуск по беременности', icon: FileText, color: 'pink', category: 'maternity' },
    '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti': { label: 'Заявление на продление отпуска', icon: FileText, color: 'pink', category: 'maternity' },
    '11_soglashenie-o-rastorzhenii-trudovogo-dogovora': { label: 'Соглашение о расторжении ТД', icon: FileText, color: 'red', category: 'termination' },
    '12_dop-soglashenie-ob-izmenenii-familii': { label: 'Доп. соглашение об изменении фамилии', icon: FileText, color: 'indigo', category: 'hr_change' },
    // Uploaded docs
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
    const [signingDocId, setSigningDocId] = useState<string | null>(null);
    const [employerSigningDocId, setEmployerSigningDocId] = useState<string | null>(null);
    const [signatureSheetDocId, setSignatureSheetDocId] = useState<string | null>(null);
    const [paramsModalOpen, setParamsModalOpen] = useState(false);
    const [pendingDocType, setPendingDocType] = useState<DocumentType | null>(null);
    const [isIbanModalOpen, setIsIbanModalOpen] = useState(false);
    const [ibanInput, setIbanInput] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [employeeData, setEmployeeData] = useState<any>(null);

    const loadDocuments = useCallback(async () => {
        try {
            const [docs, emp] = await Promise.all([
                api.getDocuments(employeeId),
                api.getEmployee(employeeId).catch(() => null)
            ]);
            setDocuments(docs);
            setEmployeeData(emp);
        } catch (err) { console.error('Failed to load documents:', err); }
        finally { setIsLoading(false); }
    }, [employeeId]);

    useEffect(() => { loadDocuments(); }, [loadDocuments]);

    const handlePreview = async (doc: Document) => {
        const docConfig = DOCUMENT_TYPES[doc.type] || { label: doc.type };
        
        console.log('👁️ Preview clicked:', doc.id, doc.type, docConfig.label);
        console.log('📝 Document scan_url:', doc.scan_url);
        
        try {
            console.log('📡 Fetching document content...');
            const response = await api.getDocumentContent(doc.id);
            console.log('📥 API Response:', { 
                hasContent: !!response.content, 
                hasUrl: !!response.scan_url
            });
            
            // Always try to show content in modal for HTML files
            if (response.content) {
                console.log('✅ Showing content in modal');
                setPreviewDoc({ content: response.content, type: doc.type, title: docConfig.label });
            } 
            // For HTML files without content, fetch directly and show in modal
            else if (doc.scan_url?.endsWith('.html') && response.scan_url) {
                console.log('📄 HTML file, fetching content directly...');
                try {
                    const contentResponse = await fetch(response.scan_url);
                    const contentText = await contentResponse.text();
                    
                    if (contentText && contentText.trim().startsWith('<')) {
                        console.log('✅ Fetched HTML content, showing in modal');
                        setPreviewDoc({ content: contentText, type: doc.type, title: docConfig.label });
                    } else {
                        console.log('⚠️ Not HTML content, opening URL');
                        window.open(response.scan_url, '_blank');
                    }
                } catch (fetchErr: any) {
                    console.error('❌ Failed to fetch HTML:', fetchErr.message);
                    window.open(response.scan_url, '_blank');
                }
            }
            // For PDFs or when all else fails, open in new window
            else if (response.scan_url) {
                console.log('🔗 Opening URL in new window:', response.scan_url);
                window.open(response.scan_url, '_blank');
            } else {
                console.error('❌ No content or URL available');
                alert('Не удалось загрузить содержимое документа');
            }
        } catch (err: any) {
            console.error('❌ Preview error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
            alert('Ошибка при загрузке документа: ' + errorMessage);
        }
    };

    const handleGenerate = async (type: string, bypassModal = false, params?: any) => {
        if (type === 'contract' && !bypassModal) { setIsIbanModalOpen(true); return; }
        
        // Show params modal for documents that need additional data
        if (!params) {
            const needsParams = [
                'vacation_order', 'vacation_application', 'termination_order',
                'employment_certificate', 'addendum',
                '01_zayavlenie-o-vyhode-s-dekreta',
                '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom',
                '03_zayavlenie-ob-izmenenii-personalnyh-dannyh',
                '04_prikaz-ob-otpuske-po-beremennosti-i-rodam',
                '05_prikaz-o-prodlenii-otpuska-po-beremennosti',
                '06_prikaz-o-vnesenii-izmeneniy-v-fio',
                '07_prikaz-o-vyhode-iz-otpuska-po-uhodu',
                '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu',
                '09_zayavlenie-na-otpusk-po-beremennosti',
                '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti',
                '11_soglashenie-o-rastorzhenii-trudovogo-dogovora',
                '12_dop-soglashenie-ob-izmenenii-familii',
            ];
            if (needsParams.includes(type)) {
                setPendingDocType(type as DocumentType);
                setParamsModalOpen(true);
                return;
            }
        }
        
        setIsGenerating(type);
        try {
            const { content } = await api.generateDocument(employeeId, type, type === 'contract' ? ibanInput : undefined, params);
            const docConfig = DOCUMENT_TYPES[type] || { label: 'Документ' };
            setPreviewDoc({ content, type, title: docConfig.label });
            await loadDocuments();
            if (isIbanModalOpen) { setIsIbanModalOpen(false); setIbanInput(''); }
        } catch (err) { console.error('Failed to generate:', err); alert('Ошибка генерации'); }
        finally { setIsGenerating(null); }
    };

    const handleParamsConfirm = async (params: any) => {
        if (pendingDocType) {
            await handleGenerate(pendingDocType, false, params);
            setParamsModalOpen(false);
            setPendingDocType(null);
        }
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

    const handleDelete = async (docId: string, docType: string, docStatus?: string) => {
        const docName = DOCUMENT_TYPES[docType]?.label || 'Документ';

        // Check if document is fully signed (both parties)
        if (docStatus === 'signed') {
            alert('❌ Нельзя удалить подписанный документ!\n\nПодписанные документы хранятся в архиве.\nЕсли документ был подписан ошибочно, создайте новый с правильными данными.');
            return;
        }

        if (!confirm(`Удалить "${docName}"?\n\n⚠️ Это действие необратимо.`)) return;
        try { await api.deleteDocument(docId); await loadDocuments(); if (onStatusChange) onStatusChange(); }
        catch (err) { console.error(err); alert('Ошибка удаления'); }
    };

    const handleGenerateSigningLink = async (docId: string) => {
        try {
            const response = await fetch(`/api/documents/${docId}/signing-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Copy to clipboard
                await navigator.clipboard.writeText(data.signingUrl);
                alert(`✅ Ссылка скопирована в буфер обмена!\n\n${data.signingUrl}\n\nСрок действия: ${new Date(data.expiresAt).toLocaleDateString('ru-RU')}`);
            }
        } catch (err) {
            console.error('Failed to generate signing link:', err);
            alert('Ошибка генерации ссылки');
        }
    };

    const getStatusBadge = (doc: Document) => {
        const requiresEmployer = doc.requires_employer_signature;
        const employerSigned = doc.employer_signed_at;
        const signedAt = doc.signed_at;
        const completedAt = doc.signing_completed_at;

        const tooltip = [
            signedAt ? `Подписан сотрудником: ${new Date(signedAt).toLocaleString('ru-RU')}` : null,
            employerSigned ? `Подписан работодателем: ${new Date(employerSigned).toLocaleString('ru-RU')}` : null,
            completedAt ? `Завершено: ${new Date(completedAt).toLocaleString('ru-RU')}` : null,
        ].filter(Boolean).join('\n');

        const badge = (() => {
            if (doc.status === 'fully_signed' || (doc.status === 'signed' && employerSigned)) {
                return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Подписан обеими сторонами</span>;
            }
            if (doc.status === 'employer_signed') {
                return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Работодатель подписал, ждёт работника</span>;
            }
            if (doc.status === 'signed' && requiresEmployer && !employerSigned) {
                return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Работник подписал, ждёт работодателя</span>;
            }
            if (doc.status === 'signed') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Подписан</span>;
            if (doc.status === 'draft') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Черновик</span>;
            if (doc.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Отклонен</span>;
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">На подписании</span>;
        })();

        return (
            <span title={tooltip || undefined} className="cursor-help">
                {badge}
            </span>
        );
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
                                        <button onClick={() => handlePreview(doc)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Просмотр">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {doc.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => setSigningDocId(doc.id)}
                                                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                                    title="Подписать (eGov или NCALayer)"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEmployerSigningDocId(doc.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                    title="Подписать как работодатель (NCALayer)"
                                                >
                                                    <PenTool className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleGenerateSigningLink(doc.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                    title="Отправить ссылку на подписание"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        {/* Работник подписал, но работодатель ещё нет — показать кнопку подписания работодателем */}
                                        {doc.status === 'signed' && (doc as any).requires_employer_signature && !(doc as any).employer_signed_at && (
                                            <button
                                                onClick={() => setEmployerSigningDocId(doc.id)}
                                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                title="Подписать как работодатель (NCALayer)"
                                            >
                                                <PenTool className="h-4 w-4" />
                                            </button>
                                        )}
                                        {/* Документ подписан обеими сторонами — лист подписей */}
                                        {(doc.status === 'fully_signed' || ((doc as any).employer_signed_at && doc.status === 'signed')) && (
                                            <button
                                                onClick={() => setSignatureSheetDocId(doc.id)}
                                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                                title="Лист подписей"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(doc.id, doc.type, doc.status)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Удалить" disabled={doc.status === 'signed'}>
                                            <Trash2 className={cn("h-4 w-4", doc.status === 'signed' ? 'opacity-30 cursor-not-allowed' : '')} />
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
                                        <button onClick={() => handleDelete(doc.id, doc.type, doc.status)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Удалить" disabled={doc.status === 'signed'}>
                                            <Trash2 className={cn("h-4 w-4", doc.status === 'signed' ? 'opacity-30 cursor-not-allowed' : '')} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Generate Buttons - Redesigned */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold text-slate-900">Сформировать документ</h3>
                </div>
                
                {/* Main Documents */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <button
                        onClick={() => handleGenerate('contract')}
                        disabled={!!isGenerating}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md",
                            isGenerating === 'contract'
                                ? "border-primary bg-primary/10"
                                : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                        )}
                    >
                        {isGenerating === 'contract' ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        )}
                        <span className="text-sm font-medium text-slate-900">Трудовой договор</span>
                    </button>

                    <button
                        onClick={() => handleGenerate('addendum')}
                        disabled={!!isGenerating}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md",
                            isGenerating === 'addendum'
                                ? "border-primary bg-primary/10"
                                : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                        )}
                    >
                        {isGenerating === 'addendum' ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        )}
                        <span className="text-sm font-medium text-slate-900">Доп. соглашение</span>
                    </button>

                    <button
                        onClick={() => handleGenerate('order_hiring')}
                        disabled={!!isGenerating}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md",
                            isGenerating === 'order_hiring'
                                ? "border-primary bg-primary/10"
                                : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                        )}
                    >
                        {isGenerating === 'order_hiring' ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        <span className="text-sm font-medium text-slate-900">Приказ о приеме</span>
                    </button>

                    <button
                        onClick={() => handleGenerate('application')}
                        disabled={!!isGenerating}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md",
                            isGenerating === 'application'
                                ? "border-primary bg-primary/10"
                                : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                        )}
                    >
                        {isGenerating === 'application' ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                        )}
                        <span className="text-sm font-medium text-slate-900">Заявление</span>
                    </button>
                </div>
                
                {/* Additional Documents */}
                <div className="border-t border-primary/20 pt-4">
                    <p className="text-xs font-semibold text-slate-600 mb-3">📄 Дополнительные документы</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                            onClick={() => handleGenerate('vacation_application')}
                            disabled={!!isGenerating}
                            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                            {isGenerating === 'vacation_application' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <div className="h-7 w-7 rounded bg-purple-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-700">Заявление на отпуск</span>
                        </button>

                        <button
                            onClick={() => handleGenerate('vacation_order')}
                            disabled={!!isGenerating}
                            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                            {isGenerating === 'vacation_order' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <div className="h-7 w-7 rounded bg-purple-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-700">Приказ на отпуск</span>
                        </button>

                        <button
                            onClick={() => handleGenerate('termination_order')}
                            disabled={!!isGenerating}
                            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                            {isGenerating === 'termination_order' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-700">Приказ об увольнении</span>
                        </button>

                        <button
                            onClick={() => handleGenerate('employment_certificate')}
                            disabled={!!isGenerating}
                            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                            {isGenerating === 'employment_certificate' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <div className="h-7 w-7 rounded bg-slate-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-700">Справка с места работы</span>
                        </button>
                    </div>
                </div>

                {/* Maternity / Childcare Documents */}
                <div className="border-t border-primary/20 pt-4">
                    <p className="text-xs font-semibold text-pink-600 mb-3">🍼 Декрет / Отпуск по уходу</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { key: '01_zayavlenie-o-vyhode-s-dekreta', label: 'Выход с декрета' },
                            { key: '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom', label: 'Отпуск по уходу' },
                            { key: '04_prikaz-ob-otpuske-po-beremennosti-i-rodam', label: 'Отпуск по беременности' },
                            { key: '05_prikaz-o-prodlenii-otpuska-po-beremennosti', label: 'Продление отпуска' },
                            { key: '07_prikaz-o-vyhode-iz-otpuska-po-uhodu', label: 'Выход из отпуска' },
                            { key: '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu', label: 'Отпуск без ЗП' },
                            { key: '09_zayavlenie-na-otpusk-po-beremennosti', label: 'Заявл. по беременности' },
                            { key: '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti', label: 'Заявл. на продление' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => handleGenerate(key)}
                                disabled={!!isGenerating}
                                className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-slate-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
                            >
                                {isGenerating === key ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                ) : (
                                    <div className="h-7 w-7 rounded bg-pink-100 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                )}
                                <span className="text-xs font-medium text-slate-700">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* HR Changes */}
                <div className="border-t border-primary/20 pt-4">
                    <p className="text-xs font-semibold text-orange-600 mb-3">📝 Кадровые изменения</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { key: '03_zayavlenie-ob-izmenenii-personalnyh-dannyh', label: 'Изменение данных' },
                            { key: '06_prikaz-o-vnesenii-izmeneniy-v-fio', label: 'Изменение ФИО' },
                            { key: '12_dop-soglashenie-ob-izmenenii-familii', label: 'Доп. согл. фамилия' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => handleGenerate(key)}
                                disabled={!!isGenerating}
                                className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all"
                            >
                                {isGenerating === key ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                ) : (
                                    <div className="h-7 w-7 rounded bg-orange-100 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                )}
                                <span className="text-xs font-medium text-slate-700">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Termination */}
                <div className="border-t border-primary/20 pt-4">
                    <p className="text-xs font-semibold text-red-600 mb-3">🔚 Расторжение</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                            onClick={() => handleGenerate('11_soglashenie-o-rastorzhenii-trudovogo-dogovora')}
                            disabled={!!isGenerating}
                            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all"
                        >
                            {isGenerating === '11_soglashenie-o-rastorzhenii-trudovogo-dogovora' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-700">Соглашение о расторжении</span>
                        </button>
                    </div>
                </div>
                
                <p className="text-xs text-slate-500 mt-3">
                    💡 Документы формируются автоматически на основе данных сотрудника
                </p>
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
            {signingDocId && (
                <SigexSignModal
                    documentId={signingDocId}
                    documentTitle={(() => {
                        const doc = documents.find(d => d.id === signingDocId);
                        return doc ? (DOCUMENT_TYPES[doc.type]?.label || "Документ") : "Документ";
                    })()}
                    onClose={() => setSigningDocId(null)}
                    onSuccess={() => { setSigningDocId(null); loadDocuments(); }}
                    preRegisteredDocumentId={(() => {
                        const doc = documents.find(d => d.id === signingDocId);
                        return doc?.sigex_document_id;
                    })() || undefined}
                />
            )}

            {/* Employer signing modal — NCALayer only */}
            {employerSigningDocId && (
                <SigexSignModal
                    documentId={employerSigningDocId}
                    documentTitle={(() => {
                        const doc = documents.find(d => d.id === employerSigningDocId);
                        return doc ? (DOCUMENT_TYPES[doc.type]?.label || "Документ") : "Документ";
                    })()}
                    onClose={() => setEmployerSigningDocId(null)}
                    onSuccess={() => { setEmployerSigningDocId(null); loadDocuments(); }}
                    signingRole="employer"
                />
            )}

            {/* Signature sheet modal */}
            {signatureSheetDocId && (
                <SignatureSheetModal
                    documentId={signatureSheetDocId}
                    documentTitle={(() => {
                        const doc = documents.find(d => d.id === signatureSheetDocId);
                        return doc ? (DOCUMENT_TYPES[doc.type]?.label || "Документ") : "Документ";
                    })()}
                    onClose={() => setSignatureSheetDocId(null)}
                />
            )}
            <DocumentParamsModal
                isOpen={paramsModalOpen}
                documentType={pendingDocType}
                employeeData={employeeData}
                onClose={() => { setParamsModalOpen(false); setPendingDocType(null); }}
                onConfirm={handleParamsConfirm}
            />
        </div>
    );
}
