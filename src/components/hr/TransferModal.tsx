import { useState, useEffect } from "react";
import { api, type PVZ } from "@/services/api";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransferModalProps {
    employeeName: string;
    currentPvzId?: string;
    onClose: () => void;
    onConfirm: (pvzId: string, date: string, comment: string) => void;
}

export function TransferModal({ employeeName, currentPvzId, onClose, onConfirm }: TransferModalProps) {
    const [pvzPoints, setPvzPoints] = useState<PVZ[]>([]);
    const [selectedPvzId, setSelectedPvzId] = useState('');
    const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadPvzPoints = async () => {
            try {
                const points = await api.getPvzList();
                setPvzPoints(points.filter(p => p.id !== currentPvzId));
            } catch (err) {
                console.error(err);
            }
        };
        loadPvzPoints();
    }, [currentPvzId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        onConfirm(selectedPvzId, transferDate, comment);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Перевод сотрудника</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">Сотрудник</p>
                        <p className="font-medium">{employeeName}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Новая точка <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={selectedPvzId}
                            onChange={(e) => setSelectedPvzId(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Выберите ПВЗ</option>
                            {pvzPoints.map(pvz => (
                                <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Дата перевода <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="date"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Комментарий</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Причина перевода (опционально)"
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
                                "flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                "Перевод..."
                            ) : (
                                <>
                                    <ArrowRight className="h-4 w-4" />
                                    Перевести
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
