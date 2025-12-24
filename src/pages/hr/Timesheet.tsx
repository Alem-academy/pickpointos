import { useState, useEffect } from 'react';
import { api, type PVZ } from '@/services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Download, CheckCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth } from '@/components/layout/AuthContext';

export default function Timesheet() {
    const { user } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedPvz, setSelectedPvz] = useState<string>('');
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [timesheetData, setTimesheetData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadPvz = async () => {
            const list = await api.getPvzList();
            setPvzList(list);

            // Auto-select PVZ for RF users or if user has a main_pvz
            if (user?.main_pvz_id) {
                setSelectedPvz(user.main_pvz_id);
            } else if (user?.pvz_id) {
                // Fallback if property name differs in some contexts
                setSelectedPvz(user.pvz_id);
            }
        };
        loadPvz();
    }, [user]);

    useEffect(() => {
        const loadTimesheet = async () => {
            setIsLoading(true);
            try {
                // If no PVZ selected yet (and user might be admin who wants 'all'), 
                // but usually for 'rf' we want filtered. 
                // If selectedPvz is empty string, backend returns all? 
                // Let's assume yes, but for RF we want to be specific.

                const data = await api.getTimesheet(selectedMonth, selectedPvz);
                setTimesheetData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadTimesheet();
    }, [selectedMonth, selectedPvz]);

    const handleApprove = async () => {
        if (!confirm('Вы уверены, что хотите утвердить табель за этот месяц? Это действие заблокирует изменения.')) return;
        try {
            await api.approveTimesheet(selectedMonth, selectedPvz);
            alert('Табель успешно утвержден');
            // Reload data
            const data = await api.getTimesheet(selectedMonth, selectedPvz);
            setTimesheetData(data);
        } catch (err) {
            console.error(err);
            alert('Ошибка утверждения табеля');
        }
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(new Date(selectedMonth)),
        end: endOfMonth(new Date(selectedMonth))
    });

    // Group shifts by employee
    const employees = Array.isArray(timesheetData) ? Array.from(new Set(timesheetData.map(s => s.employee_id))).map(id => {
        const shift = timesheetData.find(s => s.employee_id === id);
        return {
            id,
            name: shift?.employee_name || 'Unknown',
            shifts: timesheetData.filter(s => s.employee_id === id)
        };
    }) : [];

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-black">Табель учета рабочего времени</h1>
                    <p className="text-xl text-muted-foreground">Учет фактических часов и утверждение для зарплаты</p>
                </div>
                <div className="flex gap-4">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="h-12 rounded-xl border-2 border-black bg-white px-4 font-bold"
                    />
                    <select
                        value={selectedPvz}
                        onChange={e => setSelectedPvz(e.target.value)}
                        className="h-12 rounded-xl border-2 border-black bg-white px-4 font-bold"
                    >
                        <option value="">Все ПВЗ</option>
                        {pvzList.map(pvz => (
                            <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleApprove}
                        className="flex h-12 items-center gap-2 rounded-xl bg-green-600 px-6 font-bold text-white shadow-lg hover:bg-green-700"
                    >
                        <CheckCircle className="h-5 w-5" />
                        УТВЕРДИТЬ МЕСЯЦ
                    </button>
                    <button
                        className="flex h-12 items-center gap-2 rounded-xl border-2 border-black bg-white px-6 font-bold hover:bg-slate-50"
                    >
                        <Download className="h-5 w-5" />
                        ЭКСПОРТ
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border-2 border-slate-200 bg-white shadow-xl">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-10 border-b-2 border-r-2 border-slate-100 bg-slate-50 p-4 text-left font-black">Сотрудник</th>
                                {daysInMonth.map(day => (
                                    <th key={day.toISOString()} className="min-w-[40px] border-b-2 border-slate-100 p-2 text-center text-xs font-bold text-slate-500">
                                        {format(day, 'd', { locale: ru })}<br />
                                        {format(day, 'EE', { locale: ru })}
                                    </th>
                                ))}
                                <th className="border-b-2 border-l-2 border-slate-100 bg-slate-50 p-4 font-black">ИТОГО</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(employee => {
                                const totalHours = employee.shifts.reduce((acc: number, s: any) => acc + (s.fact_hours || s.planned_hours || 0), 0);
                                return (
                                    <tr key={employee.id} className="hover:bg-slate-50">
                                        <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white p-4 font-bold">
                                            {employee.name}
                                        </td>
                                        {daysInMonth.map(day => {
                                            const shift = employee.shifts.find((s: any) => isSameDay(new Date(s.date), day));
                                            let cellContent = <div className="h-8 w-8 rounded-full bg-slate-100" />;

                                            if (shift) {
                                                const hours = shift.fact_hours || shift.planned_hours;
                                                const isApproved = shift.status === 'approved';

                                                if (shift.type === 'work') {
                                                    cellContent = (
                                                        <Tooltip text={`${hours} часов (${isApproved ? 'Утверждено' : 'План'})`}>
                                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white ${isApproved ? 'bg-green-500' : 'bg-blue-500'}`}>
                                                                {hours}
                                                            </div>
                                                        </Tooltip>
                                                    );
                                                } else if (shift.type === 'vacation') {
                                                    cellContent = (
                                                        <Tooltip text="Отпуск">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 font-bold text-purple-600">ОТ</div>
                                                        </Tooltip>
                                                    );
                                                } else if (shift.type === 'sick') {
                                                    cellContent = (
                                                        <Tooltip text="Больничный">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 font-bold text-red-600">БЛ</div>
                                                        </Tooltip>
                                                    );
                                                }
                                            }

                                            return (
                                                <td key={day.toISOString()} className="border-b border-slate-100 p-2 text-center">
                                                    <div className="flex justify-center">
                                                        {cellContent}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="border-b border-l border-slate-100 p-4 text-center font-black text-xl">
                                            {totalHours}
                                        </td>
                                    </tr>
                                );
                            })}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={daysInMonth.length + 2} className="p-12 text-center text-muted-foreground">
                                        Нет данных за выбранный период
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
