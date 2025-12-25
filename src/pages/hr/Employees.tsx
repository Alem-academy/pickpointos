import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, MapPin } from "lucide-react";
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
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
            </div>
        );
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'review': return 'bg-orange-100 text-orange-700';
            case 'fired': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Активен';
            case 'review': return 'Проверка';
            case 'fired': return 'Уволен';
            default: return status;
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-black text-slate-900">Сотрудники</h1>
                    <p className="text-xl text-slate-500">Управление базой персонала и статусами.</p>
                </div>
                <button
                    onClick={() => navigate('/hr/new-employee')}
                    className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
                >
                    <Plus className="h-5 w-5" />
                    Добавить
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Поиск по имени, email или телефону..."
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 pl-12 pr-4 font-bold outline-none focus:border-black transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <select
                        className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white py-4 pl-12 pr-10 font-bold outline-none focus:border-black transition-colors cursor-pointer"
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

            {/* Table */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-wider">Сотрудник</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-wider">Контакты</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-wider">Роль</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-wider">Статус</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-wider">ПВЗ</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-wider text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Сотрудники не найдены.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr
                                        key={emp.id}
                                        onClick={() => navigate(`/hr/employees/${emp.id}`)}
                                        className="group cursor-pointer hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-600 transition-colors group-hover:bg-white group-hover:shadow-md">
                                                    {emp.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-base">{emp.full_name}</div>
                                                    <div className="text-xs font-medium text-slate-400">ID: {emp.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {emp.email && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <Mail className="h-3.5 w-3.5" /> {emp.email}
                                                    </div>
                                                )}
                                                {emp.phone && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <Phone className="h-3.5 w-3.5" /> {emp.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wide border ${emp.role === 'rf'
                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {emp.role === 'rf' ? 'Региональный' : 'Менеджер'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase ${getStatusStyle(emp.status)}`}>
                                                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                                                {getStatusLabel(emp.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                {emp.main_pvz_name || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 opacity-0 transition-all group-hover:bg-white group-hover:text-black group-hover:shadow-sm group-hover:opacity-100">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </div>
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
