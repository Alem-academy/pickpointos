"use client";

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { toast } from "sonner";

export default function FinanceDashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        opex: 0,
        netProfit: 0,
        pendingExpenses: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Fetch P&L for current month and pending expenses
                const today = new Date();
                const monthStr = today.toISOString().slice(0, 7); // YYYY-MM

                // Fetch PVZ list first to get a valid ID
                const pvzList = await api.getPvzList();
                const mainPvz = pvzList[0];

                if (!mainPvz) {
                    toast.error("No PVZ found");
                    setIsLoading(false);
                    return;
                }

                const [pnl, expenses] = await Promise.all([
                    api.getPnL(mainPvz.id, monthStr),
                    api.getExpenses('pending')
                ]);

                setStats({
                    revenue: pnl.revenue,
                    opex: pnl.opex,
                    netProfit: pnl.netProfit,
                    pendingExpenses: expenses.length
                });
            } catch (err) {
                console.error(err);
                toast.error("Failed to load finance stats");
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Финансы</h1>
                <p className="text-muted-foreground">Обзор финансовых показателей</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2 border-primary/10 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground">
                            Выручка (Тек. месяц)
                        </CardTitle>
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.revenue.toLocaleString()} ₸</div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground">
                            Расходы (OpEx)
                        </CardTitle>
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.opex.toLocaleString()} ₸</div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 shadow-md bg-slate-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground">
                            Чистая Прибыль
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {stats.netProfit.toLocaleString()} ₸
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-orange-100 bg-orange-50 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-orange-700">
                            Заявки на оплату
                        </CardTitle>
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-orange-700">{stats.pendingExpenses}</div>
                        <p className="text-xs font-bold text-orange-600">Ожидают согласования</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Placeholder for charts or more detailed widgets */}
                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Структура расходов</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                        График расходов будет здесь
                    </CardContent>
                </Card>

                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Динамика выручки</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                        График выручки будет здесь
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
