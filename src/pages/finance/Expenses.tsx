import { useState, useEffect } from 'react';
import { api, type PVZ } from '@/services/api';
import { useExpenses } from '@/hooks/use-queries';
import { type ExpenseRequest } from '@/types/schemas';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/layout/AuthContext';

export default function Expenses() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: expenses, isLoading, error } = useExpenses();
    const [showModal, setShowModal] = useState(false);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);

    // Form State
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'supplies',
        description: '',
        pvzId: ''
    });

    // Load PVZs and set default
    useEffect(() => {
        api.getPvzList().then(list => {
            setPvzList(list);
            // Default to user's PVZ or first one
            if (user?.pvz_id) {
                setNewExpense(prev => ({ ...prev, pvzId: user.pvz_id }));
            } else if (list.length > 0) {
                setNewExpense(prev => ({ ...prev, pvzId: list[0].id }));
            }
        }).catch(err => console.error("Failed to load PVZs", err));
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newExpense.pvzId) {
            toast.error('Выберите ПВЗ');
            return;
        }

        try {
            await api.createExpense({
                ...newExpense,
                amount: Number(newExpense.amount)
            });
            setShowModal(false);
            // Reset form but keep PVZ
            setNewExpense(prev => ({ ...prev, amount: '', category: 'supplies', description: '' }));
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Заявка создана успешно');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка создания заявки: ' + (err as Error).message);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Вы уверены, что хотите ${status === 'approved' ? 'одобрить' : 'отклонить'} заявку?`)) return;
        try {
            await api.updateExpenseStatus(id, status);
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success(`Заявка ${status === 'approved' ? 'одобрена' : 'отклонена'}`);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка обновления статуса');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Ошибка загрузки расходов.</div>;
    }

    const safeExpenses = expenses || [];

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-black">Операционные расходы</h1>
                    <p className="text-xl text-muted-foreground">Управление заявками на расходы и ремонт</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
                >
                    <Plus className="h-5 w-5" />
                    НОВАЯ ЗАЯВКА
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Pending */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-orange-50 p-4 text-orange-700">
                        <Clock className="h-5 w-5" />
                        <h2 className="font-bold uppercase">На рассмотрении</h2>
                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-black">
                            {safeExpenses.filter(e => e.status === 'pending').length}
                        </span>
                    </div>
                    {safeExpenses.filter(e => e.status === 'pending').length === 0 && (
                        <div className="text-center text-sm text-slate-400 py-4">Нет заявок</div>
                    )}
                    {safeExpenses.filter(e => e.status === 'pending').map(expense => (
                        <ExpenseCard key={expense.id} expense={expense} onStatusUpdate={handleStatusUpdate} />
                    ))}
                </div>

                {/* Approved */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <h2 className="font-bold uppercase">Одобрено</h2>
                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-black">
                            {safeExpenses.filter(e => e.status === 'approved').length}
                        </span>
                    </div>
                    {safeExpenses.filter(e => e.status === 'approved').map(expense => (
                        <ExpenseCard key={expense.id} expense={expense} />
                    ))}
                </div>

                {/* Rejected */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <h2 className="font-bold uppercase">Отклонено</h2>
                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-black">
                            {safeExpenses.filter(e => e.status === 'rejected').length}
                        </span>
                    </div>
                    {safeExpenses.filter(e => e.status === 'rejected').map(expense => (
                        <ExpenseCard key={expense.id} expense={expense} />
                    ))}
                </div>
            </div>

            {/* New Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                        <h2 className="mb-6 text-2xl font-black">Новая заявка</h2>
                        <p className="mb-4 text-sm text-muted-foreground">Заполните данные о расходе или заявке на ремонт.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-bold">ПВЗ</label>
                                <select
                                    required
                                    value={newExpense.pvzId}
                                    onChange={e => setNewExpense({ ...newExpense, pvzId: e.target.value })}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-black"
                                >
                                    <option value="">Выберите ПВЗ...</option>
                                    {pvzList.map(pvz => (
                                        <option key={pvz.id} value={pvz.id}>{pvz.name} ({pvz.address})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-bold">Категория</label>
                                <select
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-black"
                                >
                                    <option value="supplies">Расходники (пакеты, скотч)</option>
                                    <option value="repairs">Ремонт (кондиционер, мебель)</option>
                                    <option value="marketing">Маркетинг</option>
                                    <option value="other">Прочее</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-bold">Сумма (₸)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-black"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-bold">Описание</label>
                                <textarea
                                    required
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-black"
                                    rows={3}
                                    placeholder="Например: Замена фреона в кондиционере"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-xl bg-slate-100 py-3 font-bold hover:bg-slate-200"
                                >
                                    ОТМЕНА
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-black py-3 font-bold text-white hover:bg-slate-800"
                                >
                                    СОЗДАТЬ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ExpenseCard({ expense, onStatusUpdate }: { expense: ExpenseRequest, onStatusUpdate?: (id: string, status: 'approved' | 'rejected') => void }) {
    return (
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-3 flex items-start justify-between">
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-600">
                    {expense.category === 'supplies' ? 'Расходники' :
                        expense.category === 'repairs' ? 'Ремонт' :
                            expense.category === 'marketing' ? 'Маркетинг' : 'Прочее'}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                    {format(new Date(expense.created_at), 'dd.MM.yyyy')}
                </span>
            </div>

            <h3 className="mb-1 font-bold">{expense.description}</h3>
            <p className="mb-4 text-2xl font-black">{expense.amount.toLocaleString()} ₸</p>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-400">{expense.pvz_id}</span>

                {expense.status === 'pending' && onStatusUpdate ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onStatusUpdate(expense.id, 'rejected')}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            title="Отклонить"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onStatusUpdate(expense.id, 'approved')}
                            className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100"
                            title="Одобрить"
                        >
                            <CheckCircle className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold uppercase ${expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                        expense.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {expense.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                        {expense.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {expense.status === 'pending' && <Clock className="h-3 w-3" />}
                        {expense.status === 'approved' ? 'Одобрено' : expense.status === 'rejected' ? 'Отклонено' : 'Ожидает'}
                    </div>
                )}
            </div>
        </div>
    );
}
