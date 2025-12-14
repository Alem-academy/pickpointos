import { useState, useEffect, useCallback } from 'react';
import { api, type Employee } from '@/services/api';
import { ArrowRight, X, UserPlus } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/constants/tooltips';

export default function Applications() {
    const [employees, setEmployees] = useState<Employee[]>([]);

    const loadEmployees = useCallback(async () => {
        try {
            const data = await api.getEmployees();
            setEmployees(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        const fetch = async () => {
            await loadEmployees();
        };
        fetch();
    }, [loadEmployees]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await api.updateEmployeeStatus(id, newStatus);
            loadEmployees();
        } catch (err) {
            console.error(err);
        }
    };

    const columns = [
        { id: 'new', label: 'Новые', tooltip: TOOLTIPS.hr.kanban_new },
        { id: 'review', label: 'Собеседование', tooltip: TOOLTIPS.hr.kanban_review },
        { id: 'signing', label: 'Оформление', tooltip: TOOLTIPS.hr.kanban_signing },
    ];

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2">Кандидаты</h1>
                    <p className="text-xl text-muted-foreground">Управление потоком найма</p>
                </div>
                <Tooltip text={TOOLTIPS.hr.add_employee}>
                    <button className="flex items-center gap-2 rounded-2xl bg-black px-6 py-4 text-white shadow-lg hover:bg-gray-800">
                        <UserPlus className="h-6 w-6" />
                        Добавить вручную
                    </button>
                </Tooltip>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {columns.map(col => (
                    <div key={col.id} className="flex flex-col gap-4">
                        <Tooltip text={col.tooltip}>
                            <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h2 className="uppercase">{col.label}</h2>
                                <div className="mt-2 text-4xl font-black">
                                    {employees.filter(e => e.status === col.id).length}
                                </div>
                            </div>
                        </Tooltip>

                        <div className="flex flex-col gap-4">
                            {employees
                                .filter(e => e.status === col.id)
                                .map(employee => (
                                    <div key={employee.id} className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-black hover:shadow-md">
                                        <div className="mb-4">
                                            <h3 className="text-lg">{employee.full_name}</h3>
                                            <p className="text-muted-foreground">{employee.phone}</p>
                                            <p className="text-sm font-bold text-blue-600">{employee.main_pvz_name || 'ПВЗ не назначен'}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            {col.id !== 'signing' ? (
                                                <Tooltip text={TOOLTIPS.hr.card_move}>
                                                    <button
                                                        onClick={() => handleStatusUpdate(employee.id, col.id === 'new' ? 'review' : 'signing')}
                                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-bold text-white hover:bg-gray-800"
                                                    >
                                                        Далее <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip text="Перейти к оформлению документов">
                                                    <button
                                                        onClick={() => window.location.href = `/hr/employees/${employee.id}`}
                                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
                                                    >
                                                        Оформить <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                            )}
                                            <Tooltip text={TOOLTIPS.hr.card_reject}>
                                                <button
                                                    onClick={() => handleStatusUpdate(employee.id, 'fired')}
                                                    className="flex items-center justify-center rounded-xl border-2 border-red-100 bg-red-50 px-4 text-red-600 hover:border-red-200 hover:bg-red-100"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
