"use client";

import { useState, useEffect } from "react";
import { api, type PVZ } from "@/services/api";
import { ArrowRight, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
                toast.error("Failed to load PVZ list");
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
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Перевод сотрудника</DialogTitle>
                    <DialogDescription>
                        Сотрудник: <span className="font-medium text-foreground">{employeeName}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pvz">
                            Новая точка <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            required
                            value={selectedPvzId}
                            onValueChange={setSelectedPvzId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите ПВЗ" />
                            </SelectTrigger>
                            <SelectContent>
                                {pvzPoints.map(pvz => (
                                    <SelectItem key={pvz.id} value={pvz.id}>{pvz.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">
                            Дата перевода <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="date"
                            required
                            type="date"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Комментарий</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Причина перевода (опционально)"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRight className="h-4 w-4" />
                            )}
                            Перевести
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
