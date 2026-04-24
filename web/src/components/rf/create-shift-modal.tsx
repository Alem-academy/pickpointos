"use client";

import { useState, useEffect } from 'react';
import { api, type Employee } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus } from 'lucide-react';

interface CreateShiftModalProps {
    onSuccess: () => void;
}

export function CreateShiftModal({ onSuccess }: CreateShiftModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [formData, setFormData] = useState({
        employee_id: '',
        date: '',
        type: 'work',
        planned_hours: '12',
        pvz_id: 'PVZ-001'
    });

    useEffect(() => {
        if (open) {
            const loadEmployees = async () => {
                try {
                    const data = await api.getEmployees({ pvzId: 'PVZ-001', status: 'active' });
                    setEmployees(data);
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to load employees");
                }
            };
            loadEmployees();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.createShift({
                ...formData,
                planned_hours: Number(formData.planned_hours),
                // @ts-ignore
                type: formData.type
            });
            toast.success("Смена создана");
            setOpen(false);
            setFormData({ ...formData, employee_id: '', date: '' });
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error("Ошибка при создании смены");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg">
                    <Plus className="h-4 w-4" />
                    Добавить смену
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Планирование смены</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Сотрудник</Label>
                        <Select
                            value={formData.employee_id}
                            onValueChange={(val) => setFormData({ ...formData, employee_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите сотрудника" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Дата</Label>
                        <Input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Тип</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="work">Работа</SelectItem>
                                    <SelectItem value="training">Обучение</SelectItem>
                                    <SelectItem value="sick">Больничный</SelectItem>
                                    <SelectItem value="vacation">Отпуск</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Часы (план)</Label>
                            <Input
                                type="number"
                                required
                                min="1"
                                max="24"
                                value={formData.planned_hours}
                                onChange={(e) => setFormData({ ...formData, planned_hours: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Сохранить
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
