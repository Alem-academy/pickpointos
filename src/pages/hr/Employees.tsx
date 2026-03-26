import { useState } from "react";
import { Plus, Mail, Phone, MapPin, MoreHorizontal, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";


export default function Employees() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: employees, isLoading, error } = useEmployees(statusFilter);

    if (isLoading) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Загрузка базы сотрудников...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-destructive">
                <p>Ошибка загрузки списка сотрудников.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Повторить попытку</Button>
            </div>
        );
    }

    const safeEmployees = Array.isArray(employees) ? employees : [];
    
    // Filter by search query
    const filteredEmployees = safeEmployees.filter((emp: any) => 
        emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phone?.includes(searchQuery)
    );

    const getStatusStyle = (status: string) => {
        const styles: any = {
            active: 'bg-emerald-100 text-emerald-700',
            review: 'bg-amber-100 text-amber-700',
            new: 'bg-blue-100 text-blue-700',
            fired: 'bg-gray-100 text-gray-700',
            revision: 'bg-red-100 text-red-700',
            signing: 'bg-purple-100 text-purple-700'
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status: string) => {
        const labels: any = {
            active: 'Активный',
            review: 'Проверка',
            new: 'Новый',
            fired: 'Уволен',
            revision: 'На доработке',
            signing: 'Подписание'
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6 bg-slate-50/50 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Сотрудники</h2>
                    <p className="text-slate-500 mt-1">Управление командой и найм</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate('/hr/new-employee')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Поиск по имени, email, телефону..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="">Все статусы</option>
                    <option value="new">Новые</option>
                    <option value="review">На рассмотрении</option>
                    <option value="signing">Подписание</option>
                    <option value="active">Активные</option>
                    <option value="fired">Уволенные</option>
                </select>
                <div className="ml-auto text-sm text-slate-500">
                    Найдено: <span className="font-semibold text-slate-900">{filteredEmployees.length}</span>
                </div>
            </div>

            {/* Modern Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Сотрудник</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Контакты</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Роль</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Статус</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">ПВЗ</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEmployees.map((emp: any) => (
                            <tr 
                                key={emp.id} 
                                onClick={() => navigate('/hr/employees/' + emp.id)}
                                className="group hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            {emp.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{emp.full_name}</div>
                                            <div className="text-xs text-slate-500 md:hidden">{emp.email || emp.phone}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="space-y-1 text-sm text-slate-600">
                                        {emp.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {emp.email}</div>}
                                        {emp.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {emp.phone}</div>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${emp.role === 'rf' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {emp.role === 'rf' ? 'Региональный' : 'Менеджер ПВЗ'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(emp.status)}`}>
                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                                        {getStatusLabel(emp.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {emp.main_pvz_name || '—'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <MoreHorizontal className="h-5 w-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredEmployees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">Сотрудники не найдены</p>
                    <p className="text-sm text-slate-500 mt-1">Попробуйте изменить параметры поиска или фильтрации</p>
                </div>
            )}
        </div>
    );
}
