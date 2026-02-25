import { useState } from 'react';
import { api, type PVZ } from '@/services/api';
import { usePnL } from '@/hooks/use-queries';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
    TrendingUp, DollarSign, Wallet,
    ArrowUpRight, ArrowDownRight, CreditCard, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function FinanceDashboard() {
    const [selectedPvzId, setSelectedPvzId] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: pvzList } = useQuery<PVZ[]>({
        queryKey: ['pvz-list'],
        queryFn: api.getPvzList,
    });

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const { data: report, isLoading } = usePnL(selectedPvzId, dateStr);

    const chartData = [
        { name: 'Выручка', amount: report?.revenue || 0 },
        { name: 'OpEx', amount: report?.opex || 0 },
        { name: 'ФОТ', amount: report?.payroll || 0 },
        { name: 'Прибыль', amount: report?.netProfit || 0 },
    ];

    const pieData = report?.breakdown?.opex.map((item: { category: string; amount: number }, index: number) => ({
        name: item.category,
        value: item.amount,
        color: COLORS[index % COLORS.length]
    })) || [];

    return (
        <div className="flex flex-col h-full bg-background/50">
            <PageHeader
                title="Финансовый Обзор"
                description="Ключевые показатели эффективности и структура расходов"
                breadcrumbs={[{ label: "Финансы", path: "/finance" }, { label: "Дашборд" }]}
                action={
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={selectedPvzId}
                            onChange={e => setSelectedPvzId(e.target.value)}
                            className="h-9 w-full sm:w-[240px] rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="">Все ПВЗ (Общий отчет)</option>
                            {pvzList?.map(pvz => (
                                <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                            ))}
                        </select>

                        <div className="flex items-center rounded-md border border-input bg-background h-9">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-[4px]" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[120px] px-2 text-center text-sm font-semibold uppercase">
                                {format(currentDate, 'LLL yyyy', { locale: ru })}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-r-[4px]" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Загрузка данных...</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                title="Выручка"
                                value={report?.revenue ?? 0}
                                icon={TrendingUp}
                                color="text-emerald-600"
                                bg="bg-emerald-100"
                            />
                            <KpiCard
                                title="Операционные расходы"
                                value={report?.opex ?? 0}
                                icon={DollarSign}
                                color="text-orange-600"
                                bg="bg-orange-100"
                            />
                            <KpiCard
                                title="Фонд оплаты труда"
                                value={report?.payroll ?? 0}
                                icon={Wallet}
                                color="text-blue-600"
                                bg="bg-blue-100"
                            />
                            <KpiCard
                                title="Чистая Прибыль"
                                value={report?.netProfit ?? 0}
                                icon={(report?.netProfit ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight}
                                color={(report?.netProfit ?? 0) >= 0 ? "text-emerald-600" : "text-destructive"}
                                bg={(report?.netProfit ?? 0) >= 0 ? "bg-emerald-100" : "bg-destructive/10"}
                                isMain
                            />
                        </div>

                        {/* Charts & Actions Section */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Main Chart */}
                            <div className="col-span-2 rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="mb-6 text-base font-semibold">Финансовая структура</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value: number) => `${value.toLocaleString()}`} />
                                            <RechartsTooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [`${Number(value).toLocaleString()} ₸`, '']}
                                            />
                                            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Quick Actions & Breakdown */}
                            <div className="col-span-1 space-y-6">
                                {/* Expense Breakdown Pie */}
                                <div className="rounded-xl border bg-card p-6 shadow-sm h-[320px] flex flex-col">
                                    <h3 className="mb-2 text-base font-semibold">Структура расходов (OpEx)</h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry: { name: string; value: number; color: string }, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip formatter={(value: any) => `${Number(value).toLocaleString()} ₸`} />
                                                <Legend verticalAlign="bottom" height={48} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Quick Links */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Link to="/finance/expenses" className="group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                        <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-semibold">Расходы</span>
                                    </Link>
                                    <Link to="/finance/rent" className="group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                        <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-semibold">Аренда</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, bg, isMain = false }: { title: string, value: number, icon: any, color: string, bg: string, isMain?: boolean }) {
    return (
        <div className={cn(
            "relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md",
            isMain && "border-l-4 border-l-primary"
        )}>
            <div className="mb-3 flex items-start justify-between">
                <div className={cn("rounded-lg p-2.5", bg)}>
                    <Icon className={cn("h-5 w-5", color)} />
                </div>
                {isMain && <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wider uppercase">Ключевой</span>}
            </div>
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <h2 className={cn("text-2xl font-bold tracking-tight", color)}>
                        {value?.toLocaleString()}
                    </h2>
                    <span className="text-sm font-medium text-muted-foreground">₸</span>
                </div>
            </div>
        </div>
    );
}
