"use client";

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { TrendingUp, TrendingDown, DollarSign, Activity, Building, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AnalyticsPage() {
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
            toast.error("Failed to load analytics data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-xl font-bold text-destructive">Ошибка загрузки данных</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Аналитика</h1>
                <p className="text-muted-foreground">Обзор ключевых показателей</p>
            </div>

            {/* Data Warning */}
            {data.isIntermediate && (
                <Alert variant="destructive" className="border-orange-200 bg-orange-50 text-orange-800">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-900">Промежуточный расчет</AlertTitle>
                    <AlertDescription>
                        Данные из парсера (Google Sheets) за этот месяц еще не загружены.
                        Показатели выручки и прибыли могут быть неполными.
                    </AlertDescription>
                </Alert>
            )}

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-2 border-primary/10 shadow-md">
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-black uppercase text-muted-foreground">Выручка</h3>
                            <div className="rounded-full bg-green-100 p-2 text-green-700">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="text-3xl font-black">{data.revenue.toLocaleString()} ₸</div>
                        <div className="mt-2 text-sm font-bold text-green-600">+12% к прошлому месяцу</div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 shadow-md">
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-black uppercase text-muted-foreground">Расходы (OpEx)</h3>
                            <div className="rounded-full bg-red-100 p-2 text-red-700">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="text-3xl font-black">{data.opex.toLocaleString()} ₸</div>
                        <div className="mt-2 text-sm font-bold text-red-600">+5% к прошлому месяцу</div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-yellow-400 bg-yellow-400 shadow-md">
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-black uppercase text-yellow-900">Чистая Прибыль</h3>
                            <div className="rounded-full bg-black p-2 text-yellow-400">
                                <DollarSign className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-black">{data.netProfit.toLocaleString()} ₸</div>
                        <div className="mt-2 text-sm font-bold text-black">Маржинальность 24%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Top PVZ */}
                <Card className="border-2 border-primary/10 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase">
                            <Building className="h-6 w-6" />
                            Топ ПВЗ по выручке
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                            <div className="text-center font-bold text-muted-foreground">Нет данных</div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-2 border-primary/10 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase">
                            <Activity className="h-6 w-6" />
                            Последняя активность
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.recentActivity.map((item: any) => (
                            <div key={item.id} className="flex items-start gap-4 rounded-xl border-l-4 border-black bg-slate-50 p-4">
                                <div className="flex-1">
                                    <div className="font-black">{item.action}</div>
                                    <div className="text-sm font-bold text-muted-foreground">{item.detail}</div>
                                </div>
                                <div className="text-xs font-bold text-muted-foreground">{item.time}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
