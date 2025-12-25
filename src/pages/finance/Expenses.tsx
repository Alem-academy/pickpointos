import { useState, useEffect } from 'react';
import { api, type PVZ } from '@/services/api';
import { useExpenses } from '@/hooks/use-queries';
import { type ExpenseRequest } from '@/types/schemas';
import { Plus, CheckCircle, XCircle, Clock, Calendar, MapPin, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/layout/AuthContext';

export default function Expenses() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // DETERMINE ROLE & FILTER
    // DETERMINE ROLE & FILTER
    const isRF = user?.role === 'rf';
    // Roles that can manage (approve/reject) and view all
    const canManage = ['admin', 'financier', 'hr'].includes(user?.role || '');

    // RF sees only their point. Others (Management) see all.
    const filterPvzId = isRF ? (user?.pvz_id || undefined) : undefined;

    const { data: expenses, isLoading, error } = useExpenses(undefined, filterPvzId);

    // STATE
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
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
            // Default to user's PVZ or first one, logic for pre-fill
            if (user?.pvz_id) {
                setNewExpense(prev => ({ ...prev, pvzId: user.pvz_id || '' }));
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
            setShowCreateModal(false);
            // Reset form but keep PVZ and category default
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
            setSelectedExpense(null); // Close modal on action
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
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
                >
                    <Plus className="h-5 w-5" />
                    НОВАЯ ЗАЯВКА
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Pending */}
                <Column
                    title="На рассмотрении"
                    icon={Clock}
                    colorClass="text-orange-700 bg-orange-50"
                    items={safeExpenses.filter(e => e.status === 'pending')}
                    onItemClick={setSelectedExpense}
                />

                {/* Approved */}
                <Column
                    title="Одобрено"
                    icon={CheckCircle}
                    colorClass="text-green-700 bg-green-50"
                    items={safeExpenses.filter(e => e.status === 'approved')}
                    onItemClick={setSelectedExpense}
                />

                {/* Rejected */}
                <Column
                    title="Отклонено"
                    icon={XCircle}
                    colorClass="text-red-700 bg-red-50"
                    items={safeExpenses.filter(e => e.status === 'rejected')}
                    onItemClick={setSelectedExpense}
                />
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="mb-6 text-2xl font-black">Новая заявка</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-bold">ПВЗ</label>
                                <select
                                    required
                                    value={newExpense.pvzId}
                                    onChange={e => setNewExpense({ ...newExpense, pvzId: e.target.value })}
                                    disabled={isRF && !!user?.pvz_id}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-black disabled:opacity-50"
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
                                    onClick={() => setShowCreateModal(false)}
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

            {/* DETAIL MODAL */}
            {selectedExpense && (
                <DetailModal
                    expense={selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    onStatusUpdate={canManage ? handleStatusUpdate : undefined}
                />
            )}
        </div>
    );
}

function Column({ title, icon: Icon, colorClass, items, onItemClick }: {
    title: string,
    icon: any,
    colorClass: string,
    items: ExpenseRequest[],
    onItemClick: (e: ExpenseRequest) => void
}) {
    return (
        <div className="space-y-4">
            <div className={`flex items-center gap-2 rounded-xl p-4 ${colorClass}`}>
                <Icon className="h-5 w-5" />
                <h2 className="font-bold uppercase">{title}</h2>
                <span className="ml-auto rounded-full bg-white/50 px-2 py-0.5 text-xs font-black">
                    {items.length}
                </span>
            </div>
            {items.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-4">Нет заявок</div>
            )}
            {items.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} onClick={() => onItemClick(expense)} />
            ))}
        </div>
    );
}

function ExpenseCard({ expense, onClick }: { expense: ExpenseRequest, onClick: () => void }) {
    const categoryColors: Record<string, string> = {
        'supplies': 'bg-blue-100 text-blue-700',
        'repairs': 'bg-orange-100 text-orange-700',
        'marketing': 'bg-purple-100 text-purple-700',
        'other': 'bg-slate-100 text-slate-700'
    };

    const categoryNames: Record<string, string> = {
        'supplies': 'Расходники',
        'repairs': 'Ремонт',
        'marketing': 'Маркетинг',
        'other': 'Прочее'
    };

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-200 hover:shadow-xl"
        >
            <div className="mb-3 flex items-start justify-between">
                <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide ${categoryColors[expense.category] || 'bg-slate-100'}`}>
                    {categoryNames[expense.category] || expense.category}
                </span>
                <span className="text-xs font-bold text-slate-400">
                    {format(new Date(expense.created_at), 'dd.MM')}
                </span>
            </div>

            <h3 className="mb-2 line-clamp-2 text-sm font-bold text-slate-800">{expense.description}</h3>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-400">Сумма</p>
                    <p className="text-xl font-black text-slate-900">{expense.amount.toLocaleString()} ₸</p>
                </div>
                {expense.pvz_name && (
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                            {expense.pvz_name}
                        </span>
                    </div>
                )}
            </div>

            {expense.requester_name && (
                <div className="mt-3 flex items-center gap-2 border-t border-slate-50 pt-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold">
                        {expense.requester_name[0]}
                    </div>
                    <span className="text-xs font-medium text-slate-500">{expense.requester_name}</span>
                </div>
            )}
        </div>
    );
}

function DetailModal({ expense, onClose, onStatusUpdate }: {
    expense: ExpenseRequest,
    onClose: () => void,
    onStatusUpdate?: (id: string, status: 'approved' | 'rejected') => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide
                                ${expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    expense.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-orange-100 text-orange-700'}`}>
                                {expense.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                                {expense.status === 'rejected' && <XCircle className="h-3 w-3" />}
                                {expense.status === 'pending' && <Clock className="h-3 w-3" />}
                                {expense.status === 'approved' ? 'Одобрено' : expense.status === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
                            </span>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase text-slate-600">
                                {expense.category}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black">{expense.amount.toLocaleString()} ₸</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full bg-slate-200 p-2 hover:bg-slate-300 transition-colors">
                        <XCircle className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Описание</h3>
                        <p className="text-lg font-medium text-slate-800 leading-relaxed">{expense.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Точка</p>
                                <p className="font-bold text-slate-800">{expense.pvz_name || expense.pvz_id}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Заявитель</p>
                                <p className="font-bold text-slate-800">{expense.requester_name || 'Неизвестно'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Дата</p>
                                <p className="font-bold text-slate-800">{format(new Date(expense.created_at), 'dd MMMM yyyy')}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 shrink-0">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">ID заявки</p>
                                <p className="font-bold text-slate-800 break-all text-xs pt-1">{expense.id.slice(0, 8)}...</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                {expense.status === 'pending' && onStatusUpdate && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button
                            onClick={() => onStatusUpdate(expense.id, 'rejected')}
                            className="flex-1 flex justify-center items-center gap-2 rounded-xl border-2 border-red-100 bg-white py-3 font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                        >
                            <XCircle className="h-5 w-5" />
                            ОТКЛОНИТЬ
                        </button>
                        <button
                            onClick={() => onStatusUpdate(expense.id, 'approved')}
                            className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-black py-3 font-bold text-white hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
                        >
                            <CheckCircle className="h-5 w-5" />
                            ОДОБРИТЬ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
