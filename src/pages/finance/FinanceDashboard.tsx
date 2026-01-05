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
    ArrowUpRight, ArrowDownRight, CreditCard, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

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
        <div className="min-h-screen bg-gray-50/50 p-8">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Финансовый Обзор</h1>
                    <p className="text-lg text-muted-foreground">Ключевые показатели эффективности</p>
                </div>

                <div className="flex gap-4">
                    <select
                        value={selectedPvzId}
                        onChange={e => setSelectedPvzId(e.target.value)}
                        className="h-12 rounded-xl border-2 border-gray-200 bg-white px-4 font-bold shadow-sm transition-all focus:border-black focus:ring-0"
                    >
                        <option value="">ВСЕ ПВЗ (Общий отчет)</option>
                        {pvzList?.map(pvz => (
                            <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center rounded-xl border-2 border-gray-200 bg-white shadow-sm">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="px-4 py-2 hover:bg-gray-50">←</button>
                        <span className="min-w-[140px] px-2 text-center font-bold uppercase">
                            {format(currentDate, 'LLLL yyyy', { locale: ru })}
                        </span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="px-4 py-2 hover:bg-gray-50">→</button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            title="Выручка"
                            value={report?.revenue ?? 0}
                            icon={TrendingUp}
                            color="text-emerald-600"
                            bg="bg-emerald-50"
                        />
                        <KpiCard
                            title="Операционные расходы"
                            value={report?.opex ?? 0}
                            icon={DollarSign}
                            color="text-orange-600"
                            bg="bg-orange-50"
                        />
                        <KpiCard
                            title="Фонд оплаты труда"
                            value={report?.payroll ?? 0}
                            icon={Wallet}
                            color="text-blue-600"
                            bg="bg-blue-50"
                        />
                        <KpiCard
                            title="Чистая Прибыль"
                            value={report?.netProfit ?? 0}
                            icon={(report?.netProfit ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight}
                            color={(report?.netProfit ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}
                            bg={(report?.netProfit ?? 0) >= 0 ? "bg-emerald-100" : "bg-red-50"}
                            isMain
                        />
                    </div>

                    {/* Charts & Actions Section */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Chart */}
                        <div className="col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/50">
                            <h3 className="mb-6 text-lg font-bold">Финансовая структура</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <RechartsTooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? '#10B981' : '#EF4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Quick Actions & Breakdown */}
                        <div className="col-span-1 space-y-6">
                            {/* Expense Breakdown Pie */}
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/50">
                                <h3 className="mb-4 text-lg font-bold">Структура расходов</h3>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry: { name: string; value: number; color: string }, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/finance/expenses" className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-lg transition-all hover:border-blue-200 hover:bg-blue-50/50">
                                    <div className="rounded-full bg-blue-100 p-3 text-blue-600 transition-colors group-hover:bg-blue-200">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-gray-700">Расходы</span>
                                </Link>
                                <Link to="/finance/rent" className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-lg transition-all hover:border-purple-200 hover:bg-purple-50/50">
                                    <div className="rounded-full bg-purple-100 p-3 text-purple-600 transition-colors group-hover:bg-purple-200">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-gray-700">Аренда</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, bg, isMain = false }: { title: string, value: number, icon: any, color: string, bg: string, isMain?: boolean }) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-lg transition-all hover:shadow-xl",
            isMain && "border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        )}>
            <div className="mb-4 flex items-start justify-between">
                <div className={cn("rounded-2xl p-3", bg)}>
                    <Icon className={cn("h-6 w-6", color)} />
                </div>
                {isMain && <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">MAIN</span>}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h2 className={cn("text-3xl font-black tracking-tight", color)}>
                    {value?.toLocaleString()} <span className="text-lg text-gray-400">₸</span>
                </h2>
            </div>
        </div>
    );
}
