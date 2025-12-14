import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminationModalProps {
    employeeName: string;
    onClose: () => void;
    onConfirm: (reason: string, date: string, comment: string) => void;
}

const TERMINATION_REASONS = [
    'По собственному желанию',
    'По соглашению сторон',
    'Прогулы',
    'Несоответствие должности',
    'Сокращение штата',
    'Другое',
];

export function TerminationModal({ employeeName, onClose, onConfirm }: TerminationModalProps) {
    const [reason, setReason] = useState('');
    const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        onConfirm(reason, terminationDate, comment);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Увольнение сотрудника</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 flex items-start gap-3 rounded-lg bg-destructive/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Внимание</p>
                        <p className="text-sm text-muted-foreground">
                            После увольнения сотрудник потеряет доступ к системе.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">Сотрудник</p>
                        <p className="font-medium">{employeeName}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Причина увольнения <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Выберите причину</option>
                            {TERMINATION_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Дата увольнения <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="date"
                            value={terminationDate}
                            onChange={(e) => setTerminationDate(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Комментарий</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Дополнительная информация (опционально)"
                            rows={3}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? "Увольнение..." : "Уволить"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
