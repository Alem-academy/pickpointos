"use client";

import { useState, useEffect } from 'react';
import { api, type ExpenseRequest, type PVZ } from '@/services/api';
import { Plus, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'supplies',
        description: '',
        pvzId: ''
    });

    const loadData = async () => {
        try {
            const [expensesData, pvzs] = await Promise.all([
                api.getExpenses(),
                api.getPvzList()
            ]);
            setExpenses(expensesData);
            setPvzList(pvzs);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.pvzId) {
            toast.error("Выберите ПВЗ");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.createExpense({
                ...newExpense,
                amount: Number(newExpense.amount),
                pvzId: newExpense.pvzId
            });
            setShowModal(false);
            setNewExpense({ amount: '', category: 'supplies', description: '', pvzId: '' });
            toast.success("Заявка создана");
            loadData();
        } catch (err) {
            console.error(err);
            toast.error('Ошибка создания заявки');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.updateExpenseStatus(id, status);
            toast.success(status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена');
            loadData();
        } catch (err) {
            console.error(err);
            toast.error('Ошибка обновления статуса');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Операционные расходы</h1>
                    <p className="text-muted-foreground">Управление заявками на расходы ПВЗ</p>
                </div>

                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg hover:scale-105 transition-transform">
                            <Plus className="h-5 w-5" />
                            НОВАЯ ЗАЯВКА
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Новая заявка</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>ПВЗ</Label>
                                <Select
                                    value={newExpense.pvzId}
                                    onValueChange={(val) => setNewExpense({ ...newExpense, pvzId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите ПВЗ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pvzList.map(pvz => (
                                            <SelectItem key={pvz.id} value={pvz.id}>{pvz.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Категория</Label>
                                <Select
                                    value={newExpense.category}
                                    onValueChange={(val) => setNewExpense({ ...newExpense, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите категорию" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="supplies">Расходники</SelectItem>
                                        <SelectItem value="repairs">Ремонт</SelectItem>
                                        <SelectItem value="marketing">Маркетинг</SelectItem>
                                        <SelectItem value="other">Прочее</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Сумма (₸)</Label>
                                <Input
                                    type="number"
                                    required
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Описание</Label>
                                <Textarea
                                    required
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    Отмена
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Создать
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Pending */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-xl bg-orange-50 p-4 text-orange-700 border border-orange-100">
                            <Clock className="h-5 w-5" />
                            <h2 className="font-bold uppercase">На рассмотрении</h2>
                            <Badge variant="secondary" className="ml-auto bg-white text-orange-700 hover:bg-white">
                                {expenses.filter(e => e.status === 'pending').length}
                            </Badge>
                        </div>
                        {expenses.filter(e => e.status === 'pending').map(expense => (
                            <ExpenseCard key={expense.id} expense={expense} onStatusUpdate={handleStatusUpdate} />
                        ))}
                    </div>

                    {/* Approved */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-green-700 border border-green-100">
                            <CheckCircle className="h-5 w-5" />
                            <h2 className="font-bold uppercase">Одобрено</h2>
                            <Badge variant="secondary" className="ml-auto bg-white text-green-700 hover:bg-white">
                                {expenses.filter(e => e.status === 'approved').length}
                            </Badge>
                        </div>
                        {expenses.filter(e => e.status === 'approved').map(expense => (
                            <ExpenseCard key={expense.id} expense={expense} />
                        ))}
                    </div>

                    {/* Rejected */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700 border border-red-100">
                            <XCircle className="h-5 w-5" />
                            <h2 className="font-bold uppercase">Отклонено</h2>
                            <Badge variant="secondary" className="ml-auto bg-white text-red-700 hover:bg-white">
                                {expenses.filter(e => e.status === 'rejected').length}
                            </Badge>
                        </div>
                        {expenses.filter(e => e.status === 'rejected').map(expense => (
                            <ExpenseCard key={expense.id} expense={expense} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ExpenseCard({ expense, onStatusUpdate }: { expense: ExpenseRequest, onStatusUpdate?: (id: string, status: 'approved' | 'rejected') => void }) {
    return (
        <Card className="transition-all hover:shadow-md">
            <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                    <Badge variant="secondary" className="uppercase font-bold text-muted-foreground">
                        {expense.category}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                        {format(new Date(expense.createdAt), 'dd.MM.yyyy')}
                    </span>
                </div>

                <h3 className="mb-1 font-bold leading-tight">{expense.description}</h3>
                <p className="mb-4 text-2xl font-black">{expense.amount.toLocaleString()} ₸</p>

                <div className="flex items-center justify-between border-t pt-3 mt-3">
                    <span className="text-xs font-bold text-muted-foreground">{expense.pvzId}</span>

                    {expense.status === 'pending' && onStatusUpdate ? (
                        <div className="flex gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onStatusUpdate(expense.id, 'rejected')}
                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                title="Отклонить"
                            >
                                <XCircle className="h-5 w-5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onStatusUpdate(expense.id, 'approved')}
                                className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                title="Одобрить"
                            >
                                <CheckCircle className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <Badge
                            variant="outline"
                            className={`gap-1 ${expense.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                expense.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-orange-50 text-orange-700 border-orange-200'
                                }`}
                        >
                            {expense.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                            {expense.status === 'rejected' && <XCircle className="h-3 w-3" />}
                            {expense.status === 'pending' && <Clock className="h-3 w-3" />}
                            {expense.status === 'approved' ? 'Одобрено' : expense.status === 'rejected' ? 'Отклонено' : 'Ожидает'}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
