import { useState } from 'react';
import { api, type PVZ } from '@/services/api';
import { usePnL } from '@/hooks/use-queries';
import { Calculator, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/constants/tooltips';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export default function PnLPage() {
    const queryClient = useQueryClient();
    const [selectedPvzId, setSelectedPvzId] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: pvzList } = useQuery<PVZ[]>({
        queryKey: ['pvz-list'],
        queryFn: api.getPvzList,
    });

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const { data: report, isLoading } = usePnL(selectedPvzId, dateStr);

    const handleCalculatePayroll = async () => {
        if (!selectedPvzId) return toast.error('Выберите ПВЗ для пересчета');
        try {
            await api.calculatePayroll({ pvzId: selectedPvzId, month: dateStr });
            queryClient.invalidateQueries({ queryKey: ['pnl', selectedPvzId, dateStr] });
            toast.success('Зарплата пересчитана');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка расчета');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <PageHeader
                title="P&L Отчет"
                description="Подробный отчет о прибылях и убытках"
                breadcrumbs={[{ label: "Финансы", path: "/finance" }, { label: "P&L Отчет" }]}
                action={
                    <Tooltip text={TOOLTIPS.pnl.calculate_btn}>
                        <Button
                            onClick={handleCalculatePayroll}
                            disabled={!selectedPvzId}
                            className={cn("gap-2 shadow-md")}
                            variant={selectedPvzId ? "default" : "secondary"}
                        >
                            <Calculator className="h-4 w-4" />
                            Пересчитать ФОТ
                        </Button>
                    </Tooltip>
                }
            />

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center rounded-xl border bg-card p-4 shadow-sm">
                    <select
                        value={selectedPvzId}
                        onChange={e => setSelectedPvzId(e.target.value)}
                        className="h-10 w-full md:w-[300px] rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="">Все ПВЗ (Общий отчет)</option>
                        {pvzList?.map(pvz => (
                            <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center rounded-md border border-input bg-background h-10 shadow-sm">
                        <Button variant="ghost" className="rounded-none rounded-l-[4px] px-3 font-semibold text-muted-foreground hover:text-foreground" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Пред.
                        </Button>
                        <span className="min-w-[150px] px-4 py-2 border-x border-input text-center text-sm font-bold uppercase tracking-wider text-foreground">
                            {format(currentDate, 'LLLL yyyy', { locale: ru })}
                        </span>
                        <Button variant="ghost" className="rounded-none rounded-r-[4px] px-3 font-semibold text-muted-foreground hover:text-foreground" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            След.
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Загрузка данных...</p>
                    </div>
                ) : report ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {/* Revenue */}
                        <Tooltip text={TOOLTIPS.pnl.revenue}>
                            <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-lg bg-emerald-100 p-2.5">
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Выручка</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black text-emerald-600 tracking-tight">{report.revenue.toLocaleString()}</span>
                                    <span className="text-sm font-semibold text-emerald-600/70">₸</span>
                                </div>
                            </div>
                        </Tooltip>

                        {/* OpEx */}
                        <Tooltip text={TOOLTIPS.pnl.opex}>
                            <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-lg bg-orange-100 p-2.5">
                                        <DollarSign className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OpEx (Расходы)</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black text-orange-600 tracking-tight">{report.opex.toLocaleString()}</span>
                                    <span className="text-sm font-semibold text-orange-600/70">₸</span>
                                </div>
                            </div>
                        </Tooltip>

                        {/* Payroll */}
                        <Tooltip text={TOOLTIPS.pnl.payroll}>
                            <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-lg bg-red-100 p-2.5">
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ФОТ (Зарплата)</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black text-red-600 tracking-tight">{report.payroll.toLocaleString()}</span>
                                    <span className="text-sm font-semibold text-red-600/70">₸</span>
                                </div>
                            </div>
                        </Tooltip>

                        {/* Net Profit */}
                        <Tooltip text={TOOLTIPS.pnl.net_profit}>
                            <div className={cn(
                                "rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow",
                                report.netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                            )}>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className={cn("rounded-lg p-2.5", report.netProfit >= 0 ? "bg-emerald-200/50" : "bg-red-200/50")}>
                                        <Calculator className={cn("h-5 w-5", report.netProfit >= 0 ? "text-emerald-700" : "text-red-700")} />
                                    </div>
                                    <span className={cn("text-xs font-bold uppercase tracking-wider", report.netProfit >= 0 ? "text-emerald-700/70" : "text-red-700/70")}>Чистая прибыль</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className={cn(
                                        "text-4xl font-black tracking-tight",
                                        report.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
                                    )}>
                                        {report.netProfit.toLocaleString()}
                                    </span>
                                    <span className={cn("text-sm font-semibold", report.netProfit >= 0 ? "text-emerald-700/70" : "text-red-700/70")}>₸</span>
                                </div>
                            </div>
                        </Tooltip>
                    </div>
                ) : (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-card/50">
                        <div className="text-center text-sm text-muted-foreground">Не удалось загрузить данные. Пожалуйста, попробуйте позже.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
