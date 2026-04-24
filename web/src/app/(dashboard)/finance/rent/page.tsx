"use client";

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Building, CheckCircle, AlertCircle, Wallet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function RentPage() {
    const [rentData, setRentData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });

    const loadData = async () => {
        try {
            const data = await api.getRentOverview();
            setRentData(data);

            const total = data.reduce((acc: number, item: any) => acc + item.amount, 0);
            const paid = data.filter((item: any) => item.status === 'paid').reduce((acc: number, item: any) => acc + item.amount, 0);
            const pending = total - paid;
            setStats({ total, paid, pending });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load rent data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handlePay = async (pvzId: string, amount: number) => {
        // In a real app, use a proper confirmation dialog
        if (!confirm(`Подтвердить оплату аренды ${amount.toLocaleString()} ₸?`)) return;
        try {
            await api.payRent(pvzId, format(new Date(), 'yyyy-MM'), amount);
            toast.success('Оплата прошла успешно');
            loadData();
        } catch (err) {
            console.error(err);
            toast.error('Ошибка оплаты');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Аренда и Платежи</h1>
                <p className="text-muted-foreground">Управление арендой ПВЗ и коммунальными платежами</p>
            </div>

            {/* Dashboard */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-2 border-primary/10 shadow-md">
                    <CardContent className="p-6">
                        <div className="mb-2 flex items-center gap-3 text-muted-foreground">
                            <Wallet className="h-6 w-6" />
                            <span className="font-bold uppercase">Общий бюджет</span>
                        </div>
                        <p className="text-4xl font-black">{stats.total.toLocaleString()} ₸</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-green-600 bg-green-50 shadow-md">
                    <CardContent className="p-6">
                        <div className="mb-2 flex items-center gap-3 text-green-700">
                            <CheckCircle className="h-6 w-6" />
                            <span className="font-bold uppercase">Оплачено</span>
                        </div>
                        <p className="text-4xl font-black text-green-700">{stats.paid.toLocaleString()} ₸</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-orange-500 bg-orange-50 shadow-md">
                    <CardContent className="p-6">
                        <div className="mb-2 flex items-center gap-3 text-orange-700">
                            <AlertCircle className="h-6 w-6" />
                            <span className="font-bold uppercase">К оплате</span>
                        </div>
                        <p className="text-4xl font-black text-orange-700">{stats.pending.toLocaleString()} ₸</p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rentData.map(item => (
                        <Card key={item.pvzId} className="group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 font-black text-xl">
                                        {item.pvzId}
                                    </div>
                                    <Badge
                                        variant={item.status === 'paid' ? 'default' : 'secondary'}
                                        className={`px-3 py-1 text-sm font-bold uppercase ${item.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                                            }`}
                                    >
                                        {item.status === 'paid' ? 'Оплачено' : 'Ожидает'}
                                    </Badge>
                                </div>

                                <h3 className="mb-1 text-xl font-bold">{item.pvzName}</h3>
                                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building className="h-4 w-4" />
                                    {item.address}
                                </div>

                                <div className="mb-6 space-y-2 rounded-xl bg-slate-50 p-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Арендодатель:</span>
                                        <span className="font-medium">{item.landlord}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Срок оплаты:</span>
                                        <span className="font-bold text-red-600">{format(new Date(item.dueDate), 'dd.MM.yyyy')}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                        <span className="font-bold">Сумма:</span>
                                        <span className="text-xl font-black">{item.amount.toLocaleString()} ₸</span>
                                    </div>
                                </div>

                                {item.status !== 'paid' && (
                                    <Button
                                        onClick={() => handlePay(item.pvzId, item.amount)}
                                        className="w-full font-bold shadow-lg"
                                    >
                                        ОПЛАТИТЬ СЕЙЧАС
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
