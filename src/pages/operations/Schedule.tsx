import { useState, useEffect, useCallback } from 'react';
import { api, type PVZ, type Employee, type Shift } from '@/services/api';
import { Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/constants/tooltips';

export default function SchedulePage() {
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [selectedPvzId, setSelectedPvzId] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);

    // Generator Modal State
    const [showGenerator, setShowGenerator] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [teamA, setTeamA] = useState<string[]>([]);
    const [teamB, setTeamB] = useState<string[]>([]);
    const [genStartDate, setGenStartDate] = useState('');
    const [genEndDate, setGenEndDate] = useState('');

    // Shift Modal State
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [shiftDate, setShiftDate] = useState('');
    const [shiftEmployeeId, setShiftEmployeeId] = useState('');
    const [shiftType, setShiftType] = useState<'scheduled' | 'extra'>('scheduled');
    const [shiftHours, setShiftHours] = useState(12);

    useEffect(() => {
        const loadPvzList = async () => {
            try {
                const list = await api.getPvzList();
                setPvzList(list);
                if (list.length > 0) setSelectedPvzId(list[0].id);
            } catch (err) {
                console.error(err);
            }
        };
        loadPvzList();
    }, []);

    const loadShifts = useCallback(async () => {
        try {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();
            const data = await api.getShifts(selectedPvzId, start, end);
            setShifts(data);
        } catch (err) {
            console.error(err);
        }
    }, [currentDate, selectedPvzId]);

    const loadEmployees = useCallback(async () => {
        try {
            const data = await api.getEmployees({ pvzId: selectedPvzId, status: 'active' });
            setEmployees(data);
        } catch (err) {
            console.error(err);
        }
    }, [selectedPvzId]);

    useEffect(() => {
        if (selectedPvzId) {
            const fetch = async () => {
                await Promise.all([loadShifts(), loadEmployees()]);
            };
            fetch();
        }
    }, [selectedPvzId, currentDate, loadShifts, loadEmployees]);

    const handleGenerate = async () => {
        try {
            await api.generateSchedule({
                pvzId: selectedPvzId,
                teamA,
                teamB,
                startDate: genStartDate,
                endDate: genEndDate
            });
            setShowGenerator(false);
            loadShifts();
        } catch (err) {
            console.error(err);
            alert('Ошибка генерации');
        }
    };

    const handleCellClick = (date: Date) => {
        setEditingShift(null);
        setShiftDate(format(date, 'yyyy-MM-dd'));
        setShiftEmployeeId('');
        setShiftType('scheduled');
        setShiftHours(12);
        setShowShiftModal(true);
    };

    const handleShiftClick = (e: React.MouseEvent, shift: Shift) => {
        e.stopPropagation();
        setEditingShift(shift);
        setShiftDate(shift.date.split('T')[0]);
        setShiftEmployeeId(shift.employee_id);
        setShiftType(shift.type);
        setShiftHours(shift.planned_hours);
        setShowShiftModal(true);
    };

    const handleSaveShift = async () => {
        try {
            if (editingShift) {
                await api.updateShift(editingShift.id, {
                    employee_id: shiftEmployeeId,
                    date: shiftDate,
                    type: shiftType,
                    planned_hours: shiftHours
                });
            } else {
                await api.createShift({
                    pvz_id: selectedPvzId,
                    employee_id: shiftEmployeeId,
                    date: shiftDate,
                    type: shiftType,
                    planned_hours: shiftHours,
                    status: 'pending'
                });
            }
            setShowShiftModal(false);
            loadShifts();
        } catch (err) {
            console.error(err);
            alert('Ошибка сохранения');
        }
    };

    const handleDeleteShift = async () => {
        if (!editingShift) return;
        if (!confirm('Удалить смену?')) return;
        try {
            await api.deleteShift(editingShift.id);
            setShowShiftModal(false);
            loadShifts();
        } catch (err) {
            console.error(err);
            alert('Ошибка удаления');
        }
    };

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const getShiftForDay = (date: Date) => {
        return shifts.filter(s => isSameDay(new Date(s.date), date));
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2">График смен</h1>
                    <p className="text-xl text-muted-foreground">Планирование выходов сотрудников</p>
                </div>
                <div className="flex gap-4">
                    <select
                        value={selectedPvzId}
                        onChange={e => setSelectedPvzId(e.target.value)}
                        className="h-12 rounded-xl border-2 border-black bg-white px-4 font-bold"
                    >
                        {pvzList.map(pvz => (
                            <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                        ))}
                    </select>

                    <Tooltip text={TOOLTIPS.schedule.generate_btn}>
                        <button
                            onClick={() => setShowGenerator(true)}
                            className="flex h-12 items-center gap-2 rounded-xl bg-black px-6 font-bold text-white shadow-lg hover:bg-gray-800"
                        >
                            <Wand2 className="h-5 w-5" />
                            Генератор 2/2
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="mb-6 flex items-center justify-between rounded-2xl border-2 border-black bg-white p-4 shadow-sm">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="font-bold hover:underline">
                    ← Пред. месяц
                </button>
                <h2 className="text-2xl font-black uppercase">
                    {format(currentDate, 'LLLL yyyy', { locale: ru })}
                </h2>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="font-bold hover:underline">
                    След. месяц →
                </button>
            </div>

            {/* Schedule Health */}
            {days.filter(d => isSameMonth(d, currentDate) && getShiftForDay(d).length === 0).length > 0 && (
                <div className="mb-6 rounded-2xl border-2 border-red-100 bg-red-50 p-4 text-red-800">
                    <div className="flex items-center gap-2 font-black uppercase">
                        ⚠️ Внимание: {days.filter(d => isSameMonth(d, currentDate) && getShiftForDay(d).length === 0).length} дней без смен
                    </div>
                    <p className="mt-1 text-sm font-medium opacity-80">
                        В эти дни точка не откроется. Назначьте смены вручную или используйте генератор.
                    </p>
                </div>
            )}

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-4">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="text-center font-black uppercase text-muted-foreground">
                        {day}
                    </div>
                ))}

                {days.map(day => {
                    const dayShifts = getShiftForDay(day);
                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => handleCellClick(day)}
                            className={cn(
                                "min-h-[120px] cursor-pointer rounded-xl border-2 border-slate-200 bg-white p-3 transition-all hover:border-black",
                                !isSameMonth(day, currentDate) && "opacity-50 bg-slate-50"
                            )}
                        >
                            <div className="mb-2 text-right text-lg font-bold text-slate-400">
                                {format(day, 'd')}
                            </div>
                            <div className="space-y-2">
                                {dayShifts.map(shift => (
                                    <Tooltip key={shift.id} text={shift.status === 'closed' ? TOOLTIPS.schedule.shift_status_closed : TOOLTIPS.schedule.shift_status_pending}>
                                        <div
                                            onClick={(e) => handleShiftClick(e, shift)}
                                            className={cn(
                                                "rounded-lg p-2 text-sm font-bold hover:opacity-80",
                                                shift.status === 'closed' ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                                            )}
                                        >
                                            {shift.employee_name || 'Сотрудник'}
                                            <div className="text-xs font-normal opacity-75">
                                                {shift.planned_hours}ч
                                            </div>
                                        </div>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Generator Modal */}
            {showGenerator && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
                        <h2 className="mb-6 text-3xl font-black">Генератор графика 2/2</h2>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div>
                                <Tooltip text={TOOLTIPS.schedule.generate_modal_team_a}>
                                    <label className="mb-2 block font-bold">Команда А (Первая смена)</label>
                                </Tooltip>
                                <select
                                    multiple
                                    className="h-48 w-full rounded-xl border-2 border-slate-200 p-2"
                                    onChange={e => setTeamA(Array.from(e.target.selectedOptions, o => o.value))}
                                >
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Tooltip text={TOOLTIPS.schedule.generate_modal_team_b}>
                                    <label className="mb-2 block font-bold">Команда Б (Вторая смена)</label>
                                </Tooltip>
                                <select
                                    multiple
                                    className="h-48 w-full rounded-xl border-2 border-slate-200 p-2"
                                    onChange={e => setTeamB(Array.from(e.target.selectedOptions, o => o.value))}
                                >
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block font-bold">Начало периода</label>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-2 border-slate-200 p-3 font-bold"
                                    onChange={e => setGenStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block font-bold">Конец периода</label>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-2 border-slate-200 p-3 font-bold"
                                    onChange={e => setGenEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                onClick={() => setShowGenerator(false)}
                                className="rounded-xl px-6 py-3 font-bold hover:bg-slate-100"
                            >
                                ОТМЕНА
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="rounded-xl bg-black px-6 py-3 font-bold text-white hover:bg-gray-800"
                            >
                                СГЕНЕРИРОВАТЬ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shift Modal */}
            {showShiftModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
                        <h2 className="mb-6 text-3xl font-black">
                            {editingShift ? 'Редактировать смену' : 'Новая смена'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block font-bold">Дата</label>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-2 border-slate-200 p-3 font-bold"
                                    value={shiftDate}
                                    onChange={e => setShiftDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block font-bold">Сотрудник</label>
                                <select
                                    className="w-full rounded-xl border-2 border-slate-200 p-3 font-bold"
                                    value={shiftEmployeeId}
                                    onChange={e => setShiftEmployeeId(e.target.value)}
                                >
                                    <option value="">Выберите сотрудника</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block font-bold">Тип</label>
                                <select
                                    className="w-full rounded-xl border-2 border-slate-200 p-3 font-bold"
                                    value={shiftType}
                                    onChange={e => setShiftType(e.target.value as any)}
                                >
                                    <option value="scheduled">Плановая смена</option>
                                    <option value="extra">Доп. выход</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block font-bold">Часы (план)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-xl border-2 border-slate-200 p-3 font-bold"
                                    value={shiftHours}
                                    onChange={e => setShiftHours(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                            {editingShift && (
                                <button
                                    onClick={handleDeleteShift}
                                    className="mr-auto rounded-xl border-2 border-red-100 bg-red-50 px-6 py-3 font-bold text-red-600 hover:bg-red-100"
                                >
                                    УДАЛИТЬ
                                </button>
                            )}
                            <button
                                onClick={() => setShowShiftModal(false)}
                                className="rounded-xl px-6 py-3 font-bold hover:bg-slate-100"
                            >
                                ОТМЕНА
                            </button>
                            <button
                                onClick={handleSaveShift}
                                className="rounded-xl bg-black px-6 py-3 font-bold text-white hover:bg-gray-800"
                            >
                                СОХРАНИТЬ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
