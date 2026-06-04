import { CheckCircle2, AlertCircle, FileText, FileCheck, FileEdit, Plane, UserX, Award, Image, IdCard, Stethoscope, Banknote, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentChecklistProps {
    documents?: any[];
    onGenerate?: (type: string) => void;
    onUpload?: (type: string) => void;
}

export function DocumentChecklist({ documents = [], onGenerate, onUpload }: DocumentChecklistProps) {
    const requiredDocs = [
        // Generated (hiring process)
        { type: '13_zayavlenie-o-prieme-na-rabotu', label: 'Заявление о приеме на работу', icon: FileEdit, color: 'amber', category: 'generated' },
        { type: '14_prikaz-o-prieme-na-rabotu', label: 'Приказ о приеме на работу', icon: FileCheck, color: 'emerald', category: 'generated' },
        { type: '15_trudovoy-dogovor', label: 'Трудовой договор', icon: FileText, color: 'blue', category: 'generated' },
        // Uploaded
        { type: 'id_main', label: 'Удостоверение личности (лицевая)', icon: IdCard, color: 'indigo', category: 'uploaded' },
        { type: 'id_register', label: 'Удостоверение личности (оборот)', icon: IdCard, color: 'indigo', category: 'uploaded' },
        { type: 'cert_075', label: 'Справка № 075 (медосмотр)', icon: Stethoscope, color: 'green', category: 'uploaded' },
        { type: 'photo', label: 'Фото на фоне удостоверения', icon: Image, color: 'pink', category: 'uploaded' },
        { type: 'address_cert', label: 'Скрин eGov с адресом регистрации', icon: MapPin, color: 'orange', category: 'uploaded' },
        { type: 'bank_details', label: 'Справка банка с IBAN', icon: Banknote, color: 'emerald', category: 'uploaded' },
        { type: 'cert_tb', label: 'Справка нарко-, псих-, противотуберкулезного диспансера', icon: Stethoscope, color: 'green', category: 'uploaded' },
        { type: 'criminal_record', label: 'Справка об отсутствии судимости', icon: FileCheck, color: 'slate', category: 'uploaded' },
        { type: 'handwritten_application', label: 'Заявление на прием (рукописное)', icon: FileEdit, color: 'amber', category: 'uploaded' },
        { type: 'tax_deduction', label: 'Заявление на вычет', icon: Banknote, color: 'emerald', category: 'uploaded' },
    ];

    const optionalDocs = [
        { type: 'vacation_application', label: 'Заявление на отпуск', icon: Plane, color: 'purple', category: 'generated' },
        { type: 'employment_certificate', label: 'Справка с места работы', icon: Award, color: 'slate', category: 'generated' },
        { type: 'termination_order', label: 'Приказ об увольнении', icon: UserX, color: 'red', category: 'generated' },
    ];

    const getDocStatus = (type: string) => {
        const doc = documents.find(d => d.type === type);
        if (!doc) return 'missing';
        if (doc.status === 'signed') return 'complete';
        if (doc.status === 'draft' || doc.status === 'sent_to_employee') return 'pending';
        if (doc.status === 'rejected') return 'rejected';
        return 'missing';
    };

    const completedCount = requiredDocs.filter(d => getDocStatus(d.type) === 'complete').length;
    const progress = Math.round((completedCount / requiredDocs.length) * 100);

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm">Документы для приема</h4>
                    <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        progress === 100 ? "bg-emerald-100 text-emerald-700" :
                        progress >= 60 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                    )}>
                        {completedCount}/{requiredDocs.length}
                    </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                        className={cn(
                            "h-full transition-all duration-500",
                            progress === 100 ? "bg-emerald-500" :
                            progress >= 60 ? "bg-amber-500" :
                            "bg-red-500"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Required Documents */}
            <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Обязательные документы</h4>
                <div className="space-y-2">
                    {requiredDocs.map((doc) => {
                        const status = getDocStatus(doc.type);
                        const Icon = doc.icon;
                        
                        return (
                            <div 
                                key={doc.type}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                                    status === 'complete' ? "bg-emerald-50/50 border-emerald-200" :
                                    status === 'pending' ? "bg-amber-50/50 border-amber-200" :
                                    status === 'rejected' ? "bg-red-50/50 border-red-200" :
                                    "bg-card border-muted"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        status === 'complete' ? "bg-emerald-100" :
                                        status === 'pending' ? "bg-amber-100" :
                                        status === 'rejected' ? "bg-red-100" :
                                        "bg-muted"
                                    )}>
                                        <Icon className={cn(
                                            "h-4 w-4",
                                            status === 'complete' ? "text-emerald-600" :
                                            status === 'pending' ? "text-amber-600" :
                                            status === 'rejected' ? "text-red-600" :
                                            "text-muted-foreground"
                                        )} />
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "text-sm font-medium",
                                            status === 'complete' ? "text-emerald-700" :
                                            status === 'pending' ? "text-amber-700" :
                                            status === 'rejected' ? "text-red-700" :
                                            "text-foreground"
                                        )}>
                                            {doc.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {status === 'complete' ? 'Подписан' :
                                             status === 'pending' ? 'На подписании' :
                                             status === 'rejected' ? 'Отклонен' :
                                             'Не загружен'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {status === 'missing' && doc.category === 'generated' && onGenerate && (
                                        <button
                                            onClick={() => onGenerate(doc.type)}
                                            className="text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                                        >
                                            Создать
                                        </button>
                                    )}
                                    {status === 'missing' && doc.category === 'uploaded' && onUpload && (
                                        <button
                                            onClick={() => onUpload(doc.type)}
                                            className="text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                                        >
                                            Загрузить
                                        </button>
                                    )}
                                    {status === 'complete' && (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    )}
                                    {status === 'pending' && (
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                    {status === 'rejected' && (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Optional Documents */}
            <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Дополнительные документы</h4>
                <div className="space-y-2">
                    {optionalDocs.map((doc) => {
                        const status = getDocStatus(doc.type);
                        const Icon = doc.icon;
                        
                        return (
                            <div 
                                key={doc.type}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                                    status === 'complete' ? "bg-card border-emerald-200" :
                                    "bg-card border-muted"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        status === 'complete' ? "bg-emerald-100" : "bg-muted"
                                    )}>
                                        <Icon className={cn(
                                            "h-4 w-4",
                                            status === 'complete' ? "text-emerald-600" : "text-muted-foreground"
                                        )} />
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "text-sm font-medium",
                                            status === 'complete' ? "text-emerald-700" : "text-foreground"
                                        )}>
                                            {doc.label}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {status === 'missing' && doc.category === 'generated' && onGenerate && (
                                        <button
                                            onClick={() => onGenerate(doc.type)}
                                            className="text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                                        >
                                            Создать
                                        </button>
                                    )}
                                    {status === 'complete' && (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
