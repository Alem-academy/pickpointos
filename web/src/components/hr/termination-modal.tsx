"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Увольнение сотрудника</DialogTitle>
                    <DialogDescription>
                        Сотрудник: <span className="font-medium text-foreground">{employeeName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4 flex items-start gap-3 rounded-lg bg-destructive/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Внимание</p>
                        <p className="text-sm text-muted-foreground">
                            После увольнения сотрудник потеряет доступ к системе.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Причина увольнения <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            required
                            value={reason}
                            onValueChange={setReason}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите причину" />
                            </SelectTrigger>
                            <SelectContent>
                                {TERMINATION_REASONS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">
                            Дата увольнения <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="date"
                            required
                            type="date"
                            value={terminationDate}
                            onChange={(e) => setTerminationDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Комментарий</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Дополнительная информация (опционально)"
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
                            variant="destructive"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Увольнение...
                                </>
                            ) : (
                                "Уволить"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
