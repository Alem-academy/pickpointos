import { useState, useEffect, useCallback } from 'react';
import { api, type Employee, type PVZ } from '@/services/api';
import { User, MapPin, Briefcase } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/constants/tooltips';
import { AddEmployeeModal } from '@/components/hr/AddEmployeeModal';
import { useNavigate } from 'react-router-dom';

export default function Employees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [selectedPvz, setSelectedPvz] = useState<string>('');
    const [statusFilter] = useState<string>('active');
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [emps, pvzs] = await Promise.all([
                api.getEmployees({ pvzId: selectedPvz, status: statusFilter }),
                api.getPvzList()
            ]);
            setEmployees(emps);
            setPvzList(pvzs);
        } catch (err) {
            console.error(err);
        }
    }, [selectedPvz, statusFilter]);

    useEffect(() => {
        const fetch = async () => {
            await loadData();
        };
        fetch();
    }, [loadData]);

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2">Сотрудники</h1>
                    <p className="text-xl text-muted-foreground">База персонала ({employees.length})</p>
                </div>
                <div className="flex gap-4">
                    <Tooltip text={TOOLTIPS.employees.filter_pvz}>
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
                    </Tooltip>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-12 items-center gap-2 rounded-xl bg-black px-6 font-bold text-white shadow-lg hover:bg-gray-800"
                    >
                        <User className="h-5 w-5" />
                        Добавить
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employees.map(employee => (
                    <Tooltip key={employee.id} text={TOOLTIPS.employees.action_profile}>
                        <div
                            onClick={() => navigate(`/hr/employees/${employee.id}`)}
                            className="cursor-pointer rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <div className="mb-4 flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl font-black">
                                    {employee.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg leading-tight">{employee.full_name}</h3>
                                    <p className="text-muted-foreground">{employee.phone}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                                    <MapPin className="h-5 w-5" />
                                    <span className="font-bold">{employee.main_pvz_name || 'Не назначен'}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                                    <Briefcase className="h-5 w-5" />
                                    <span className="font-bold uppercase">{employee.role}</span>
                                </div>
                            </div>
                        </div>
                    </Tooltip>
                ))}
            </div>

            {showAddModal && (
                <AddEmployeeModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
