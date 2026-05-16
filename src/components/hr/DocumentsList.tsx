import { useState, useEffect, useCallback } from 'react';
import { api, type Document } from '@/services/api';
import { FileText, Loader2, Upload, Eye, Trash2, File, IdCard, Image, Award, Banknote, MapPin, Stethoscope, Plane, UserX, CheckCircle, Share2, PenTool } from 'lucide-react';
import { SigexSignModal } from '../SigexSignModal';
import { SignatureSheetModal } from './SignatureSheetModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentParamsModal, type DocumentType } from './DocumentParamsModal';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

interface DocumentsListProps {
    employeeId: string;
    employeeStatus: string;
    documents?: Document[];
    onStatusChange?: () => void;
}

const DOCUMENT_TYPES: any = {
    '15_trudovoy-dogovor': { label: 'Трудовой договор', icon: FileText, color: 'blue', category: 'generated' },
    '14_prikaz-o-prieme-na-rabotu': { label: 'Приказ о приеме', icon: FileText, color: 'emerald', category: 'generated' },
    '13_zayavlenie-o-prieme-na-rabotu': { label: 'Заявление на прием', icon: FileText, color: 'amber', category: 'generated' },
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

// Process group definitions for grouping documents in the list
const PROCESS_GROUPS: Record<string, { label: string; color: string; docTypes: string[] }> = {
    hiring: { label: 'Приём на работу', color: 'blue', docTypes: ['13_zayavlenie-o-prieme-na-rabotu', '14_prikaz-o-prieme-na-rabotu', '15_trudovoy-dogovor'] },
    vacation: { label: 'Отпуск', color: 'purple', docTypes: ['vacation_application', 'vacation_order'] },
    termination: { label: 'Расторжение', color: 'red', docTypes: ['termination_order', '11_soglashenie-o-rastorzhenii-trudovogo-dogovora'] },
    maternity: { label: 'Декрет / Отпуск по уходу', color: 'pink', docTypes: ['01_zayavlenie-o-vyhode-s-dekreta', '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom', '04_prikaz-ob-otpuske-po-beremennosti-i-rodam', '05_prikaz-o-prodlenii-otpuska-po-beremennosti', '07_prikaz-o-vyhode-iz-otpuska-po-uhodu', '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu', '09_zayavlenie-na-otpusk-po-beremennosti', '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti'] },
    hr_change: { label: 'Кадровые изменения', color: 'orange', docTypes: ['03_zayavlenie-ob-izmenenii-personalnyh-dannyh', '06_prikaz-o-vnesenii-izmeneniy-v-fio', '12_dop-soglashenie-ob-izmenenii-familii'] },
    other: { label: 'Прочие документы', color: 'slate', docTypes: ['employment_certificate', 'addendum'] },
};

// Static Tailwind color classes for JIT compilation
const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600' },
};

function getColorClasses(color: string) {
    return COLOR_MAP[color] || COLOR_MAP.gray;
}

export function DocumentsList({ employeeId, documents: externalDocuments, onStatusChange }: DocumentsListProps) {
    const [internalDocuments, setInternalDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(!externalDocuments);
    const [isUploading, setIsUploading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ content: string; type: string; title: string } | null>(null);
    const [signingDocId, setSigningDocId] = useState<string | null>(null);
    const [employerSigningDocId, setEmployerSigningDocId] = useState<string | null>(null);
    const [signatureSheetDocId, setSignatureSheetDocId] = useState<string | null>(null);
    const [paramsModalOpen, setParamsModalOpen] = useState(false);
    const [pendingDocType, setPendingDocType] = useState<DocumentType | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [employeeData, setEmployeeData] = useState<any>(null);

    const documents = externalDocuments || internalDocuments;

    const loadDocuments = useCallback(async () => {
        try {
            const [docs, emp] = await Promise.all([
                api.getDocuments(employeeId),
                api.getEmployee(employeeId).catch(() => null)
            ]);
            setInternalDocuments(docs);
            setEmployeeData(emp);
        } catch (err) { console.error('Failed to load documents:', err); }
        finally { setIsLoading(false); }
    }, [employeeId]);

    useEffect(() => {
        if (externalDocuments) {
            // External documents provided — still load employeeData for params modal
            api.getEmployee(employeeId).catch(() => null).then(emp => setEmployeeData(emp));
            setIsLoading(false);
        } else {
            loadDocuments();
        }
    }, [externalDocuments, loadDocuments, employeeId]);

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

    const handleGenerate = async (type: string, _bypassModal = false, params?: any) => {
        // Show params modal for documents that need additional data
        if (!params) {
            const needsParams = [
                'vacation_order', 'vacation_application', 'termination_order',
                'employment_certificate', 'addendum',
                '13_zayavlenie-o-prieme-na-rabotu',
                '14_prikaz-o-prieme-na-rabotu',
                '15_trudovoy-dogovor',
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
        
        try {
            const { content } = await api.generateDocument(employeeId, type, undefined, params);
            const docConfig = DOCUMENT_TYPES[type] || { label: 'Документ' };
            setPreviewDoc({ content, type, title: docConfig.label });
            await loadDocuments();
            onStatusChange?.();
        } catch (err) { console.error('Failed to generate:', err); alert('Ошибка генерации'); }
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
            onStatusChange?.();
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
            {/* Generated Documents — Grouped by Process */}
            <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Сформированные документы</h3>
                {generatedDocs.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">Нет сформированных документов</p>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(PROCESS_GROUPS).map(([groupKey, group]) => {
                            const groupDocs = generatedDocs.filter(d => group.docTypes.includes(d.type));
                            if (groupDocs.length === 0) return null;
                            const allSigned = groupDocs.every(d => d.status === 'signed' || d.status === 'fully_signed');
                            return (
                                <div key={groupKey} className={cn("border rounded-xl overflow-hidden", allSigned ? "border-emerald-200" : "border-slate-200")}>
                                    <div className={cn("px-4 py-3 flex items-center justify-between", allSigned ? "bg-emerald-50" : "bg-slate-50")}>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("w-2.5 h-2.5 rounded-full", `bg-${group.color}-500`)} />
                                            <span className="text-sm font-semibold text-slate-900">{group.label}</span>
                                            <span className="text-xs text-slate-500">({groupDocs.length})</span>
                                        </div>
                                        {allSigned && <span className="text-xs font-medium text-emerald-700">✓ Завершено</span>}
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {groupDocs.map(doc => {
                                            const docConfig = DOCUMENT_TYPES[doc.type] || { label: doc.type, icon: FileText, color: 'gray' };
                                            const Icon = docConfig.icon;
                                            return (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {(() => { const c = getColorClasses(docConfig.color); return (
                                                        <div className={cn("p-2 rounded-lg", c.bg)}>
                                                            <Icon className={cn("h-5 w-5", c.text)} />
                                                        </div>
                                                        ); })()}
                                                        <div
                                                        className="cursor-pointer"
                                                        onClick={() => handlePreview(doc)}
                                                    >
                                                        <p className="text-sm font-semibold text-slate-900 hover:text-primary transition-colors">{docConfig.label}</p>
                                                        <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString('ru-RU')}</p>
                                                    </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {getStatusBadge(doc)}
                                                        <Tooltip text="Просмотр документа">
                                                            <button onClick={() => handlePreview(doc)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        </Tooltip>
                                                        {doc.status === 'draft' && (
                                                            <>
                                                                <Tooltip text="Подписать (eGov или NCALayer)">
                                                                    <button onClick={() => setSigningDocId(doc.id)} className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors">
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </button>
                                                                </Tooltip>
                                                                <Tooltip text="Подписать как работодатель (NCALayer)">
                                                                    <button onClick={() => setEmployerSigningDocId(doc.id)} className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors">
                                                                        <PenTool className="h-4 w-4" />
                                                                    </button>
                                                                </Tooltip>
                                                                <Tooltip text="Отправить ссылку на подписание">
                                                                    <button onClick={() => handleGenerateSigningLink(doc.id)} className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors">
                                                                        <Share2 className="h-4 w-4" />
                                                                    </button>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        {doc.status === 'signed' && (doc as any).requires_employer_signature && !(doc as any).employer_signed_at && (
                                                            <Tooltip text="Подписать как работодатель (NCALayer)">
                                                                <button onClick={() => setEmployerSigningDocId(doc.id)} className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors">
                                                                    <PenTool className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                        )}
                                                        {(doc.status === 'fully_signed' || ((doc as any).employer_signed_at && doc.status === 'signed')) && (
                                                            <Tooltip text="Лист подписей">
                                                                <button onClick={() => setSignatureSheetDocId(doc.id)} className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors">
                                                                    <FileText className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip text="Удалить документ">
                                                            <button onClick={() => handleDelete(doc.id, doc.type, doc.status)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" disabled={doc.status === 'signed'}>
                                                                <Trash2 className={cn("h-4 w-4", doc.status === 'signed' ? 'opacity-30 cursor-not-allowed' : '')} />
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
                                        {(() => { const c = getColorClasses(docConfig.color); return (
                                        <div className={cn("p-2 rounded-lg", c.bg)}>
                                            <Icon className={cn("h-5 w-5", c.text)} />
                                        </div>
                                        ); })()}
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{docConfig.label}</p>
                                            <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString('ru-RU')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tooltip text="Открыть документ">
                                            <button onClick={() => window.open(doc.scan_url, '_blank')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text="Удалить документ">
                                            <button onClick={() => handleDelete(doc.id, doc.type, doc.status)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" disabled={doc.status === 'signed'}>
                                                <Trash2 className={cn("h-4 w-4", doc.status === 'signed' ? 'opacity-30 cursor-not-allowed' : '')} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modals -- legacy grid removed, use ProcessLauncher for document generation */}
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
                    onSuccess={() => { setSigningDocId(null); loadDocuments(); onStatusChange?.(); }}
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
                    onSuccess={() => { setEmployerSigningDocId(null); loadDocuments(); onStatusChange?.(); }}
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
