import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/use-queries";

export default function Employees() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Use the new React Query hook
    const { data: employees, isLoading, error } = useEmployees(statusFilter);

    // Initial check for loading/error
    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Загрузка сотрудников...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Ошибка загрузки списка сотрудников.</div>;
    }

    // Filter locally by search term (React Query handles status filter via API)
    const safeEmployees = Array.isArray(employees) ? employees : [];
    const filteredEmployees = safeEmployees.filter((emp) =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'review': return 'bg-orange-100 text-orange-700';
            case 'fired': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6 pt-5 bg-slate-50/50 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Сотрудники</h2>
                    <p className="text-slate-500">Управление базой персонала и статусами.</p>
                </div>
                <Button onClick={() => navigate('/hr/new-employee')}>
                    <Plus className="mr-2 h-4 w-4" /> Добавить Сотрудника
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Поиск по имени или email..."
                        className="w-full rounded-xl border-2 border-slate-200 py-2 pl-10 pr-4 font-medium focus:border-blue-500 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 font-medium focus:border-blue-500 focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="review">На проверке</option>
                        <option value="probation">Испытательный</option>
                        <option value="fired">Уволенные</option>
                    </select>
                </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Сотрудник</th>
                                <th className="px-6 py-4 font-bold">Роль</th>
                                <th className="px-6 py-4 font-bold">Статус</th>
                                <th className="px-6 py-4 font-bold">Основной ПВЗ</th>
                                <th className="px-6 py-4 font-bold text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Сотрудники не найдены.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="group hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">
                                                    {emp.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{emp.full_name}</div>
                                                    <div className="text-xs text-slate-500">{emp.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium capitalize text-slate-700">{emp.role}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusColor(emp.status)}`}>
                                                {emp.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-medium">
                                                {/* In a real app, looking up PVZ name by ID or having backend join it */}
                                                {emp.main_pvz_id ? 'Назначен' : 'Не назначен'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/hr/employees/${emp.id}`)}>
                                                Подробнее <ChevronRight className="ml-1 h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
