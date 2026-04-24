"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, type PVZ, type PnLReport } from '@/services/api';
import { Calculator, TrendingUp, TrendingDown, DollarSign, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function PnLPage() {
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [selectedPvzId, setSelectedPvzId] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [report, setReport] = useState<PnLReport | null>(null);

    useEffect(() => {
        const loadPvzList = async () => {
            try {
                const list = await api.getPvzList();
                setPvzList(list);
                if (list.length > 0) setSelectedPvzId(list[0].id);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load PVZ list");
            }
        };
        loadPvzList();
    }, []);

    const loadReport = useCallback(async () => {
        if (!selectedPvzId) return;
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const data = await api.getPnL(selectedPvzId, dateStr);
            setReport(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load P&L report");
        }
    }, [currentDate, selectedPvzId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleCalculatePayroll = async () => {
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            await api.calculatePayroll({ pvzId: selectedPvzId, month: dateStr });
            loadReport();
            toast.success('Зарплата пересчитана');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка расчета');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">P&L Отчет</h1>
                    <p className="text-muted-foreground">Прибыли и Убытки</p>
                </div>
                <div className="flex gap-4">
                    <Select value={selectedPvzId} onValueChange={setSelectedPvzId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Выберите ПВЗ" />
                        </SelectTrigger>
                        <SelectContent>
                            {pvzList.map(pvz => (
                                <SelectItem key={pvz.id} value={pvz.id}>{pvz.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleCalculatePayroll} className="gap-2 shadow-lg">
                        <Calculator className="h-4 w-4" />
                        Пересчитать ФОТ
                    </Button>
                </div>
            </div>

            {/* Month Navigation */}
            <Card>
                <CardContent className="flex items-center justify-between p-4">
                    <Button variant="ghost" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Пред. месяц
                    </Button>
                    <h2 className="text-2xl font-black uppercase">
                        {format(currentDate, 'LLLL yyyy', { locale: ru })}
                    </h2>
                    <Button variant="ghost" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        След. месяц
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>

            {report && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Revenue */}
                    <Card className="border-2 border-primary/10 shadow-md">
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-6 w-6" />
                                <span className="font-bold uppercase">Выручка</span>
                            </div>
                            <div className="text-4xl font-black text-emerald-600">
                                {report.revenue.toLocaleString()} ₸
                            </div>
                        </CardContent>
                    </Card>

                    {/* OpEx */}
                    <Card className="border-2 border-primary/10 shadow-md">
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-6 w-6" />
                                <span className="font-bold uppercase">OpEx (Расходы)</span>
                            </div>
                            <div className="text-4xl font-black text-orange-600">
                                {report.opex.toLocaleString()} ₸
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payroll */}
                    <Card className="border-2 border-primary/10 shadow-md">
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <TrendingDown className="h-6 w-6" />
                                <span className="font-bold uppercase">ФОТ (Зарплата)</span>
                            </div>
                            <div className="text-4xl font-black text-red-600">
                                {report.payroll.toLocaleString()} ₸
                            </div>
                        </CardContent>
                    </Card>

                    {/* Net Profit */}
                    <Card className={cn(
                        "border-2 shadow-md",
                        report.netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                    )}>
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <Calculator className="h-6 w-6" />
                                <span className="font-bold uppercase">Чистая прибыль</span>
                            </div>
                            <div className={cn(
                                "text-5xl font-black",
                                report.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                                {report.netProfit.toLocaleString()} ₸
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
