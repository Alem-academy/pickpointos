import { useState } from "react";
import { Plus, Mail, Phone, MapPin, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'review': return 'bg-orange-100 text-orange-700';
            case 'fired': return 'bg-destructive/10 text-destructive';
            default: return 'bg-muted text-muted-foreground';
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

    const columns = [
        {
            header: "Сотрудник",
            accessorKey: "full_name" as keyof typeof safeEmployees[0],
            sortable: true,
            cell: (emp: any) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {emp.full_name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-foreground">{emp.full_name}</div>
                        <div className="text-xs text-muted-foreground">ID: {emp.id.slice(0, 8)}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Контакты",
            cell: (emp: any) => (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {emp.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {emp.email}</div>}
                    {emp.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {emp.phone}</div>}
                </div>
            )
        },
        {
            header: "Роль",
            accessorKey: "role" as keyof typeof safeEmployees[0],
            sortable: true,
            cell: (emp: any) => (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase ${emp.role === 'rf' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {emp.role === 'rf' ? 'Региональный' : 'Менеджер ПВЗ'}
                </span>
            )
        },
        {
            header: "Статус",
            accessorKey: "status" as keyof typeof safeEmployees[0],
            sortable: true,
            cell: (emp: any) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(emp.status)}`}>
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    {getStatusLabel(emp.status)}
                </span>
            )
        },
        {
            header: "ПВЗ",
            accessorKey: "main_pvz_name" as keyof typeof safeEmployees[0],
            sortable: true,
            cell: (emp: any) => (
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {emp.main_pvz_name || '—'}
                </div>
            )
        },
        {
            header: "",
            cell: () => (
                <div className="flex justify-end pr-2 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full bg-background/50">
            <PageHeader
                title="Сотрудники"
                description="Справочник и управление персоналом"
                breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Сотрудники" }]}
                action={
                    <Button onClick={() => navigate('/hr/new-employee')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Добавить сотрудника
                    </Button>
                }
            />

            <div className="px-6 pb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Фильтр:</span>
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

                <DataTable
                    data={safeEmployees}
                    columns={columns}
                    searchKey="full_name"
                    onRowClick={(row) => navigate(`/hr/employees/${row.id}`)}
                />
            </div>
        </div>
    );
}
