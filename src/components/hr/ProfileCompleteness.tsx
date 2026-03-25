import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletenessItem {
    label: string;
    isComplete: boolean;
    isRequired?: boolean;
}

interface ProfileCompletenessProps {
    employee: any;
    documents?: any[];
}

export function ProfileCompleteness({ employee, documents = [] }: ProfileCompletenessProps) {
    // Personal Information
    const personalItems: CompletenessItem[] = [
        { label: 'ИИН', isComplete: !!employee.iin, isRequired: true },
        { label: 'Телефон', isComplete: !!employee.phone, isRequired: true },
        { label: 'Email', isComplete: !!employee.email, isRequired: false },
        { label: 'IBAN', isComplete: !!employee.iban, isRequired: true },
        { label: 'Прописка', isComplete: !!employee.registered_address, isRequired: true },
        { label: 'Удостоверение личности', isComplete: !!employee.id_card_number, isRequired: true },
    ];

    // Work Information
    const workItems: CompletenessItem[] = [
        { label: 'Должность', isComplete: !!employee.role, isRequired: true },
        { label: 'ПВЗ', isComplete: !!employee.main_pvz_id, isRequired: true },
        { label: 'Юрлицо', isComplete: !!employee.employer_id, isRequired: true },
        { label: 'Ставка', isComplete: !!employee.base_rate, isRequired: true },
        { label: 'Дата найма', isComplete: !!employee.hired_at, isRequired: true },
    ];

    // Documents
    const requiredDocs = ['contract', 'order_hiring', 'application', 'id_main', 'photo'];
    const documentItems: CompletenessItem[] = requiredDocs.map(docType => ({
        label: getDocLabel(docType),
        isComplete: documents.some(d => d.type === docType && d.status === 'signed'),
        isRequired: true
    }));

    const personalScore = calculateScore(personalItems);
    const workScore = calculateScore(workItems);
    const documentScore = calculateScore(documentItems);
    const overallScore = Math.round((personalScore + workScore + documentScore) / 3);

    return (
        <div className="space-y-6">
            {/* Overall Progress */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Заполненность профиля</h3>
                    <div className={cn(
                        "px-4 py-2 rounded-full font-bold text-sm",
                        overallScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                        overallScore >= 50 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                    )}>
                        {overallScore}%
                    </div>
                </div>
                
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                        className={cn(
                            "h-full transition-all duration-500",
                            overallScore >= 80 ? "bg-emerald-500" :
                            overallScore >= 50 ? "bg-amber-500" :
                            "bg-red-500"
                        )}
                        style={{ width: `${overallScore}%` }}
                    />
                </div>

                {overallScore < 100 && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Заполните все обязательные поля для активации сотрудника
                    </p>
                )}
            </div>

            {/* Personal Information */}
            <CompletenessSection 
                title="Личные данные" 
                items={personalItems} 
                score={personalScore}
                icon="👤"
            />

            {/* Work Information */}
            <CompletenessSection 
                title="Рабочая информация" 
                items={workItems} 
                score={workScore}
                icon="💼"
            />

            {/* Documents */}
            <CompletenessSection 
                title="Документы" 
                items={documentItems} 
                score={documentScore}
                icon="📄"
            />
        </div>
    );
}

function CompletenessSection({ title, items, score, icon }: { 
    title: string; 
    items: CompletenessItem[]; 
    score: number;
    icon: string;
}) {
    return (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <h4 className="font-bold">{title}</h4>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    score >= 80 ? "bg-emerald-100 text-emerald-700" :
                    score >= 50 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                )}>
                    {score}%
                </div>
            </div>
            <div className="divide-y">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2">
                            {item.isComplete ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : item.isRequired ? (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={cn(
                                "text-sm",
                                item.isComplete ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {item.label}
                                {item.isRequired && !item.isComplete && (
                                    <span className="text-red-500 ml-1">*</span>
                                )}
                            </span>
                        </div>
                        {item.isComplete ? (
                            <span className="text-xs font-medium text-emerald-600">Готово</span>
                        ) : item.isRequired ? (
                            <span className="text-xs font-medium text-amber-600">Требуется</span>
                        ) : (
                            <span className="text-xs font-medium text-muted-foreground">Опционально</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function calculateScore(items: CompletenessItem[]): number {
    const requiredItems = items.filter(i => i.isRequired);
    if (requiredItems.length === 0) return 100;
    
    const completeRequired = requiredItems.filter(i => i.isComplete).length;
    return Math.round((completeRequired / requiredItems.length) * 100);
}

function getDocLabel(type: string): string {
    const labels: Record<string, string> = {
        contract: 'Трудовой договор',
        order_hiring: 'Приказ о приеме',
        application: 'Заявление',
        id_main: 'Удостоверение личности',
        photo: 'Фото 3х4',
    };
    return labels[type] || type;
}
