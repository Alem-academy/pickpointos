"use client";

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Clock, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

export default function RFDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        activeShifts: 0,
        pendingTasks: 0,
        totalEmployees: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Get first PVZ for now (simulating user's PVZ)
                const pvzList = await api.getPvzList();
                const currentPvzId = pvzList[0]?.id || 'PVZ-001';

                const [employees, shifts, expenses] = await Promise.all([
                    api.getEmployees({ pvzId: currentPvzId }),
                    api.getShifts(currentPvzId),
                    api.getExpenses() // We might want to filter by PVZ in API, but client filter works for now
                ]);

                const pendingShifts = shifts.filter(s => s.status === 'pending').length;
                const pendingExpenses = expenses.filter(e => e.pvzId === currentPvzId && e.status === 'pending').length;

                const today = new Date().toISOString().split('T')[0];
                const activeShifts = shifts.filter(s => s.status === 'approved' && s.date === today).length;

                setStats({
                    activeShifts,
                    pendingTasks: pendingShifts + pendingExpenses,
                    totalEmployees: employees.length
                });
            } catch (err) {
                console.error(err);
                toast.error("Failed to load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Управление ПВЗ</h1>
                <p className="text-muted-foreground">Обзор показателей и оперативное управление</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-2 border-primary/10 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground">
                            Активные смены
                        </CardTitle>
                        <Clock className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.activeShifts}</div>
                        <p className="text-xs font-bold text-muted-foreground">
                            Сотрудников на смене сейчас
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground">
                            Сотрудники
                        </CardTitle>
                        <Users className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.totalEmployees}</div>
                        <p className="text-xs font-bold text-muted-foreground">
                            Всего закреплено за ПВЗ
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-orange-100 bg-orange-50 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-orange-700">
                            Задачи
                        </CardTitle>
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-orange-700">{stats.pendingTasks}</div>
                        <p className="text-xs font-bold text-orange-600">
                            Требуют внимания
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="group cursor-pointer border-2 border-dashed border-slate-200 transition-colors hover:border-primary hover:bg-primary/5" onClick={() => router.push('/rf/candidates')}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="mb-4 rounded-full bg-primary/10 p-4 group-hover:bg-primary/20">
                            <Plus className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-black">Добавить кандидата</h3>
                        <p className="text-sm font-bold text-muted-foreground">
                            Создать заявку на нового сотрудника
                        </p>
                    </CardContent>
                </Card>

                <Card className="group cursor-pointer border-2 border-dashed border-slate-200 transition-colors hover:border-primary hover:bg-primary/5" onClick={() => router.push('/rf/shifts')}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="mb-4 rounded-full bg-primary/10 p-4 group-hover:bg-primary/20">
                            <Calendar className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-black">График смен</h3>
                        <p className="text-sm font-bold text-muted-foreground">
                            Планирование и управление выходами
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
