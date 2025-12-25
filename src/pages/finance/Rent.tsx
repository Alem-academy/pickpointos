import { useState } from 'react';
import { api } from '@/services/api';
import { useRent } from '@/hooks/use-queries';
import { Building, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Rent() {
    const queryClient = useQueryClient();
    const { data: rentData, isLoading } = useRent();

    const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('pending');

    // Calculate stats
    const safeRentData = rentData || [];
    const total = safeRentData.reduce((acc: number, item: any) => acc + item.amount, 0);
    const paid = safeRentData.filter((item: any) => item.status === 'paid').reduce((acc: number, item: any) => acc + item.amount, 0);
    const pending = total - paid;
    const stats = { total, paid, pending };

    // Filter Data
    const filteredData = safeRentData.filter((item: any) => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    const handlePay = async (pvzId: string, amount: number) => {
        if (!confirm(`Подтвердить оплату аренды ${amount.toLocaleString()} ₸?`)) return;
        try {
            await api.payRent(pvzId, format(new Date(), 'yyyy-MM'), amount);
            queryClient.invalidateQueries({ queryKey: ['rent'] });
            toast.success('Оплата прошла успешно');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка оплаты');
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-black">Аренда и Платежи</h1>
                    <p className="text-xl text-muted-foreground">Управление арендой ПВЗ и коммунальными платежами</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex rounded-xl bg-slate-100 p-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Все
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${filter === 'pending' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        К оплате
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${filter === 'paid' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Оплаченные
                    </button>
                </div>
            </div>

            {/* Dashboard */}
            <div className="mb-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="mb-2 flex items-center gap-3 text-muted-foreground">
                        <Wallet className="h-6 w-6" />
                        <span className="font-bold uppercase">Общий бюджет</span>
                    </div>
                    <p className="text-4xl font-black">{stats.total.toLocaleString()} ₸</p>
                </div>
                <div className="rounded-2xl border-2 border-green-600 bg-green-50 p-6 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]">
                    <div className="mb-2 flex items-center gap-3 text-green-700">
                        <CheckCircle className="h-6 w-6" />
                        <span className="font-bold uppercase">Оплачено</span>
                    </div>
                    <p className="text-4xl font-black text-green-700">{stats.paid.toLocaleString()} ₸</p>
                </div>
                <div className="rounded-2xl border-2 border-orange-500 bg-orange-50 p-6 shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]">
                    <div className="mb-2 flex items-center gap-3 text-orange-700">
                        <AlertCircle className="h-6 w-6" />
                        <span className="font-bold uppercase">К оплате</span>
                    </div>
                    <p className="text-4xl font-black text-orange-700">{stats.pending.toLocaleString()} ₸</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border-2 border-slate-100 bg-white p-6">
                                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                                <Skeleton className="h-6 w-48 mb-4" />
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredData.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                Нет записей в этой категории
                            </div>
                        ) : filteredData.map((item: any) => (
                            <div key={item.pvzId} className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 font-black text-xl">
                                        {item.pvzId}
                                    </div>
                                    <span className={`rounded-lg px-3 py-1 text-sm font-bold uppercase ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {item.status === 'paid' ? 'Оплачено' : 'Ожидает'}
                                    </span>
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
                                    <button
                                        onClick={() => handlePay(item.pvzId, item.amount)}
                                        className="w-full rounded-xl bg-black py-3 font-bold text-white transition-transform active:scale-95 hover:bg-slate-800"
                                    >
                                        ОПЛАТИТЬ СЕЙЧАС
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
