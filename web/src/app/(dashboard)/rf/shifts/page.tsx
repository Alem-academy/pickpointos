"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, type Shift } from '@/services/api';
import { CreateShiftModal } from '@/components/rf/create-shift-modal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Trash2, Clock } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from "sonner";

export default function ShiftsPage() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadShifts = useCallback(async () => {
        try {
            const data = await api.getShifts('PVZ-001');
            // Sort by date descending
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setShifts(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load shifts");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadShifts();
    }, [loadShifts]);

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить смену?')) return;
        try {
            await api.deleteShift(id);
            toast.success("Смена удалена");
            loadShifts();
        } catch (err) {
            console.error(err);
            toast.error("Ошибка удаления");
        }
    };

    // Group shifts by date
    const groupedShifts = shifts.reduce((acc, shift) => {
        const dateKey = shift.date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(shift);
        return acc;
    }, {} as Record<string, Shift[]>);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">График смен</h1>
                    <p className="text-muted-foreground">Планирование выходов сотрудников</p>
                </div>
                <CreateShiftModal onSuccess={loadShifts} />
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : Object.keys(groupedShifts).length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <Calendar className="mb-4 h-12 w-12 opacity-20" />
                        <p>Смены не запланированы</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedShifts).map(([date, dayShifts]) => (
                        <Card key={date} className="overflow-hidden border-2 border-slate-100 shadow-sm">
                            <CardHeader className="bg-slate-50 py-3">
                                <CardTitle className="flex items-center gap-2 text-lg font-bold capitalize">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    {format(parseISO(date), 'd MMMM yyyy, EEEE', { locale: ru })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {dayShifts.map(shift => (
                                        <div key={shift.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                                    {shift.employeeName ? shift.employeeName.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{shift.employeeName || 'Сотрудник'}</div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Badge variant="outline" className="text-xs">
                                                            {shift.type === 'work' ? 'Смена' :
                                                                shift.type === 'training' ? 'Обучение' :
                                                                    shift.type === 'vacation' ? 'Отпуск' : 'Больничный'}
                                                        </Badge>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {shift.plannedHours}ч
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(shift.id)}
                                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
