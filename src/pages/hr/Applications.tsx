import { useState, useEffect, useCallback } from 'react';
import { api, type Employee } from '@/services/api';
import { UserPlus, Users, ClipboardCheck, UserCheck, Briefcase } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/constants/tooltips';
import { CandidateModal } from '@/components/hr/CandidateModal';
import { format } from 'date-fns';
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

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
            label: 'Новые заявки',
            tooltip: TOOLTIPS.hr.kanban_new,
            icon: Users,
            color: 'border-blue-200 bg-blue-50/50 text-blue-700'
        },
        {
            id: 'review',
            label: 'Собеседование',
            tooltip: TOOLTIPS.hr.kanban_review,
            icon: ClipboardCheck,
            color: 'border-orange-200 bg-orange-50/50 text-orange-700'
        },
        {
            id: 'signing',
            label: 'Оформление',
            tooltip: TOOLTIPS.hr.kanban_signing,
            icon: UserCheck,
            color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700'
        },
    ];

    return (
        <div className="flex flex-col h-full bg-background/50">
            <PageHeader
                title="Воронка найма"
                description="Канбан доска для обработки новых кандидатов"
                breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Воронка" }]}
                action={
                    <Tooltip text={TOOLTIPS.hr.add_employee}>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Добавить кандидата
                        </Button>
                    </Tooltip>
                }
            />

            <div className="flex-1 overflow-x-auto px-6 pb-6">
                <div className="flex gap-6 h-full min-w-max">
                    {columns.map(col => {
                        const colEmployees = employees.filter(e => e.status === col.id);

                        return (
                            <div key={col.id} className="flex flex-col w-80 shrink-0">
                                {/* Column Header */}
                                <div className={`flex items-center gap-2 rounded-t-xl border-x border-t p-3 ${col.color}`}>
                                    <col.icon className="h-4 w-4" />
                                    <h2 className="text-sm font-semibold uppercase tracking-wider">{col.label}</h2>
                                    <span className="ml-auto rounded-md bg-background/80 px-2 py-0.5 text-xs font-bold text-foreground">
                                        {colEmployees.length}
                                    </span>
                                </div>

                                {/* Cards Area */}
                                <div className="flex-1 flex flex-col gap-3 rounded-b-xl border-x border-b border-border bg-muted/30 p-3 overflow-y-auto">
                                    {colEmployees.length === 0 && (
                                        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground p-4 text-center">
                                            Нет кандидатов на этом этапе
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
            className="group cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
        >
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase
                        ${employee.role === 'rf' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                    `}>
                        {employee.role === 'rf' ? 'RF' : 'M'}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-card-foreground leading-tight line-clamp-1" title={employee.full_name}>{employee.full_name}</h3>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{employee.role === 'rf' ? 'Региональный' : 'Менеджер ПВЗ'}</p>
                    </div>
                </div>
                {employee.created_at && (
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {format(new Date(employee.created_at), 'dd.MM')}
                    </span>
                )}
            </div>

            <div className="space-y-1.5 rounded-md bg-muted/50 p-2.5">
                <div className="flex items-center gap-2 text-xs text-card-foreground">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{employee.main_pvz_name || 'ПВЗ не назначен'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-card-foreground">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-background text-[10px] font-bold text-muted-foreground shrink-0 border">₸</span>
                    <span className="font-medium">{employee.base_rate?.toLocaleString()} ₸</span>
                </div>
            </div>
        </div>
    );
}
