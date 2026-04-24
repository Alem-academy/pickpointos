"use client";

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, FileText, Clock } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

export default function HRDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        newCandidates: 0,
        pendingDocuments: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [allEmployees, newCandidates, docStats] = await Promise.all([
                    api.getEmployees({ status: 'active' }),
                    api.getEmployees({ status: 'new' }),
                    api.getDocumentsStats()
                ]);

                setStats({
                    totalEmployees: allEmployees.length,
                    newCandidates: newCandidates.length,
                    pendingDocuments: docStats.pending
                });
            } catch (err) {
                console.error(err);
                toast.error("Failed to load HR stats");
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">HR Dashboard</h1>
                <p className="text-muted-foreground">Управление персоналом и наймом</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card
                    className="cursor-pointer border-2 border-primary/10 shadow-md transition-all hover:border-primary/50"
                    onClick={() => router.push('/hr/employees')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground">
                            Штат сотрудников
                        </CardTitle>
                        <Users className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.totalEmployees}</div>
                        <p className="text-xs font-bold text-muted-foreground">
                            Активные сотрудники
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer border-2 border-blue-100 bg-blue-50 shadow-md transition-all hover:border-blue-300"
                    onClick={() => router.push('/hr/applications')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-blue-700">
                            Новые кандидаты
                        </CardTitle>
                        <UserPlus className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-700">{stats.newCandidates}</div>
                        <p className="text-xs font-bold text-blue-600">
                            Ожидают рассмотрения
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-orange-100 bg-orange-50 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-orange-700">
                            Документы
                        </CardTitle>
                        <FileText className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-orange-700">{stats.pendingDocuments}</div>
                        <p className="text-xs font-bold text-orange-600">
                            Требуют подписи
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Последние события
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <div className="font-bold">Новая заявка на найм</div>
                                        <div className="text-xs text-muted-foreground">PVZ-00{i} • 2 часа назад</div>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
