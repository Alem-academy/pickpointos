import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { ModernEmployeeCard } from "@/components/hr/modern/ModernEmployeeCard";

export default function Employees() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('');

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

    return (
        <div className="space-y-6 bg-slate-50/50 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Сотрудники</h2>
                    <p className="text-slate-500 mt-1">Управление командой и найм</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">Все статусы</option>
                        <option value="new">Новые</option>
                        <option value="review">На рассмотрении</option>
                        <option value="active">Активные</option>
                        <option value="fired">Уволенные</option>
                    </select>
                    <Button onClick={() => navigate('/hr/employees/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {safeEmployees.map((emp: any) => (
                    <ModernEmployeeCard
                        key={emp.id}
                        fullName={emp.full_name}
                        role={emp.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'}
                        status={emp.status}
                        pvzName={emp.main_pvz_name}
                        phone={emp.phone}
                        email={emp.email}
                        hiredAt={emp.hired_at ? new Date(emp.hired_at).toLocaleDateString('ru-RU') : undefined}
                        onClick={() => navigate('/hr/employees/' + emp.id)}
                    />
                ))}
            </div>

            {safeEmployees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-slate-900">Сотрудники не найдены</p>
                    <p className="text-sm text-slate-500 mt-1">Добавьте первого сотрудника чтобы начать</p>
                </div>
            )}
        </div>
    );
}
