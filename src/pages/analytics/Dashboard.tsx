import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { TrendingUp, TrendingDown, DollarSign, Activity, Building } from 'lucide-react';

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await api.getAnalyticsDashboard();
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-xl font-bold">Загрузка аналитики...</div>;
    if (!data) return <div className="p-8 text-xl font-bold text-red-500">Ошибка загрузки данных</div>;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="mb-2 text-4xl font-black">Аналитика</h1>
                <p className="text-xl text-muted-foreground">Обзор ключевых показателей</p>
            </div>

            {/* Summary Cards */}
            <div className="mb-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-3xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase text-slate-500">Выручка</h3>
                        <div className="rounded-full bg-green-100 p-2 text-green-700">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-black">{data.revenue.toLocaleString()} ₸</div>
                    <div className="mt-2 text-sm font-bold text-green-600">+12% к прошлому месяцу</div>
                </div>

                <div className="rounded-3xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase text-slate-500">Расходы (OpEx)</h3>
                        <div className="rounded-full bg-red-100 p-2 text-red-700">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-black">{data.opex.toLocaleString()} ₸</div>
                    <div className="mt-2 text-sm font-bold text-red-600">+5% к прошлому месяцу</div>
                </div>

                <div className="rounded-3xl border-2 border-black bg-yellow-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase text-yellow-800">Чистая Прибыль</h3>
                        <div className="rounded-full bg-black p-2 text-yellow-400">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-black">{data.netProfit.toLocaleString()} ₸</div>
                    <div className="mt-2 text-sm font-bold text-black">Маржинальность 24%</div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Top PVZ */}
                <div className="rounded-3xl border-2 border-slate-200 bg-white p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <Building className="h-6 w-6" />
                        <h2 className="text-2xl font-black uppercase">Топ ПВЗ по выручке</h2>
                    </div>
                    <div className="space-y-4">
                        {data.topPvz.map((pvz: any, index: number) => (
                            <div key={index} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                                <div className="flex items-center gap-4">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <span className="font-bold">{pvz.name}</span>
                                </div>
                                <span className="font-black">{Number(pvz.revenue).toLocaleString()} ₸</span>
                            </div>
                        ))}
                        {data.topPvz.length === 0 && (
                            <div className="text-center font-bold text-slate-400">Нет данных</div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-3xl border-2 border-slate-200 bg-white p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <Activity className="h-6 w-6" />
                        <h2 className="text-2xl font-black uppercase">Последняя активность</h2>
                    </div>
                    <div className="space-y-4">
                        {data.recentActivity.map((item: any) => (
                            <div key={item.id} className="flex items-start gap-4 rounded-xl border-l-4 border-black bg-slate-50 p-4">
                                <div className="flex-1">
                                    <div className="font-black">{item.action}</div>
                                    <div className="text-sm font-bold text-slate-500">{item.detail}</div>
                                </div>
                                <div className="text-xs font-bold text-slate-400">{item.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
