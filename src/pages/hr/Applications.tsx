import { useState, useEffect, useCallback } from 'react';
import { api, type Employee } from '@/services/api';
import { UserPlus, Users, ClipboardCheck, UserCheck, Briefcase } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/constants/tooltips';
import { CandidateModal } from '@/components/hr/CandidateModal';
import { format } from 'date-fns';

export default function Applications() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<Employee | null>(null);

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
        // If status is 'signing', redirect to employee details for onboarding
        if (newStatus === 'signing') {
            window.location.href = `/hr/employees/${id}`;
            return;
        }

        try {
            await api.updateEmployeeStatus(id, newStatus);
            loadEmployees();
            if (selectedCandidate) setSelectedCandidate(null); // Close modal
        } catch (err) {
            console.error(err);
        }
    };

    const columns = [
        {
            id: 'new',
            label: 'Новые',
            tooltip: TOOLTIPS.hr.kanban_new,
            icon: Users,
            color: 'bg-blue-50 text-blue-700'
        },
        {
            id: 'review',
            label: 'Собеседование',
            tooltip: TOOLTIPS.hr.kanban_review,
            icon: ClipboardCheck,
            color: 'bg-orange-50 text-orange-700'
        },
        {
            id: 'signing',
            label: 'Оформление',
            tooltip: TOOLTIPS.hr.kanban_signing,
            icon: UserCheck,
            color: 'bg-green-50 text-green-700'
        },
    ];

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-black">Кандидаты</h1>
                    <p className="text-xl text-muted-foreground">Управление потоком найма</p>
                </div>
                <Tooltip text={TOOLTIPS.hr.add_employee}>
                    <button className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105">
                        <UserPlus className="h-5 w-5" />
                        Добавить вручную
                    </button>
                </Tooltip>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {columns.map(col => {
                    const colEmployees = employees.filter(e => e.status === col.id);

                    return (
                        <div key={col.id} className="flex flex-col gap-4">
                            {/* Column Header */}
                            <div className={`flex items-center gap-2 rounded-xl p-4 ${col.color}`}>
                                <col.icon className="h-6 w-6" />
                                <h2 className="font-bold uppercase tracking-wide">{col.label}</h2>
                                <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-xs font-black">
                                    {colEmployees.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex flex-col gap-4">
                                {colEmployees.length === 0 && (
                                    <div className="text-center text-sm text-slate-400 py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                                        Нет кандидатов
                                    </div>
                                )}
                                {colEmployees.map(employee => (
                                    <ApplicationCard
                                        key={employee.id}
                                        employee={employee}
                                        onClick={() => {
                                            if (employee.status === 'signing') {
                                                window.location.href = `/hr/employees/${employee.id}`;
                                            } else {
                                                setSelectedCandidate(employee);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Candidate Details Modal */}
            {selectedCandidate && (
                <CandidateModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onApprove={() => handleStatusUpdate(selectedCandidate.id, 'review')}
                    onReject={() => handleStatusUpdate(selectedCandidate.id, 'fired')}
                />
            )}
        </div>
    );
}

function ApplicationCard({ employee, onClick }: { employee: Employee, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-200 hover:shadow-xl"
        >
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black uppercase
                        ${employee.role === 'rf' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                    `}>
                        {employee.role === 'rf' ? 'RF' : 'M'}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 leading-tight">{employee.full_name}</h3>
                        <p className="text-xs font-bold text-slate-400">{employee.role === 'rf' ? 'Региональный' : 'Менеджер ПВЗ'}</p>
                    </div>
                </div>
                {employee.created_at && (
                    <span className="text-[10px] font-bold text-slate-300">
                        {format(new Date(employee.created_at), 'dd.MM')}
                    </span>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{employee.main_pvz_name || 'ПВЗ не назначен'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">₸</span>
                    <span className="font-medium">{employee.base_rate?.toLocaleString()} ₸</span>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Нажмите для подробностей</span>
                <div className="h-6 w-6 rounded-full bg-slate-50 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
