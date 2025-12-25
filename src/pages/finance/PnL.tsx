import { useState, useEffect } from 'react';
import { api, type PVZ } from '@/services/api';
import { usePnL } from '@/hooks/use-queries';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/constants/tooltips';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PnLPage() {
    const queryClient = useQueryClient();
    const [selectedPvzId, setSelectedPvzId] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: pvzList } = useQuery<PVZ[]>({
        queryKey: ['pvz-list'],
        queryFn: api.getPvzList,
    });

    import { useEffect } from 'react';

    // Auto-select first PVZ when list loads
    useEffect(() => {
        if (!selectedPvzId && pvzList && pvzList.length > 0) {
            setSelectedPvzId(pvzList[0].id);
        }
    }, [pvzList, selectedPvzId]);

    // Use React Query for PnL data
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const { data: report, isLoading } = usePnL(selectedPvzId, dateStr);

    const handleCalculatePayroll = async () => {
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
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2">P&L Отчет</h1>
                    <p className="text-xl text-muted-foreground">Прибыли и Убытки</p>
                </div>
                <div className="flex gap-4">
                    <select
                        value={selectedPvzId}
                        onChange={e => setSelectedPvzId(e.target.value)}
                        className="h-12 rounded-xl border-2 border-black bg-white px-4 font-bold"
                    >
                        {pvzList?.map(pvz => (
                            <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                        )) || <option>Загрузка ПВЗ...</option>}
                    </select>

                    <Tooltip text={TOOLTIPS.pnl.calculate_btn}>
                        <button
                            onClick={handleCalculatePayroll}
                            className="flex h-12 items-center gap-2 rounded-xl bg-black px-6 font-bold text-white shadow-lg hover:bg-gray-800"
                        >
                            <Calculator className="h-5 w-5" />
                            Пересчитать ФОТ
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="mb-8 flex items-center justify-between rounded-2xl border-2 border-black bg-white p-4 shadow-sm">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="font-bold hover:underline">
                    ← Пред. месяц
                </button>
                <h2 className="text-2xl font-black uppercase">
                    {format(currentDate, 'LLLL yyyy', { locale: ru })}
                </h2>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="font-bold hover:underline">
                    След. месяц →
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
                </div>
            ) : report ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Revenue */}
                    <Tooltip text={TOOLTIPS.pnl.revenue}>
                        <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-6 w-6" />
                                <span className="font-bold uppercase">Выручка</span>
                            </div>
                            <div className="text-4xl font-black text-emerald-600">
                                {report.revenue.toLocaleString()} ₸
                            </div>
                        </div>
                    </Tooltip>

                    {/* OpEx */}
                    <Tooltip text={TOOLTIPS.pnl.opex}>
                        <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-6 w-6" />
                                <span className="font-bold uppercase">OpEx (Расходы)</span>
                            </div>
                            <div className="text-4xl font-black text-orange-600">
                                {report.opex.toLocaleString()} ₸
                            </div>
                        </div>
                    </Tooltip>

                    {/* Payroll */}
                    <Tooltip text={TOOLTIPS.pnl.payroll}>
                        <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                <TrendingDown className="h-6 w-6" />
                                <span className="font-bold uppercase">ФОТ (Зарплата)</span>
                            </div>
                            <div className="text-4xl font-black text-red-600">
                                {report.payroll.toLocaleString()} ₸
                            </div>
                        </div>
                    </Tooltip>

                    {/* Net Profit */}
                    <Tooltip text={TOOLTIPS.pnl.net_profit}>
                        <div className={cn(
                            "rounded-2xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                            report.netProfit >= 0 ? "bg-emerald-50" : "bg-red-50"
                        )}>
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
                        </div>
                    </Tooltip>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">Выберите ПВЗ для просмотра отчета.</div>
            )}
        </div>
    );
}
