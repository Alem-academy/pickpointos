"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, type Employee } from '@/services/api';
import { ArrowRight, X, UserPlus, Phone, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddEmployeeModal } from '@/components/hr/add-employee-modal';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

export default function ApplicationsPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadEmployees = useCallback(async () => {
        try {
            const data = await api.getEmployees();
            setEmployees(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load applications");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await api.updateEmployeeStatus(id, newStatus);
            toast.success("Status updated");
            loadEmployees();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const columns = [
        { id: 'new', label: 'Новые', color: 'bg-blue-500' },
        { id: 'review', label: 'Собеседование', color: 'bg-purple-500' },
        { id: 'signing', label: 'Оформление', color: 'bg-emerald-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Кандидаты</h1>
                    <p className="text-muted-foreground">Управление потоком найма</p>
                </div>
                <AddEmployeeModal onSuccess={loadEmployees} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {columns.map(col => {
                    const colEmployees = employees.filter(e => e.status === col.id);

                    return (
                        <div key={col.id} className="flex flex-col gap-4">
                            <Card className="border-2 border-primary/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="uppercase text-sm font-bold text-muted-foreground">
                                            {col.label}
                                        </CardTitle>
                                        <Badge variant="secondary" className="text-lg font-bold">
                                            {colEmployees.length}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>

                            <div className="flex flex-col gap-4">
                                {colEmployees.map(employee => (
                                    <Card key={employee.id} className="transition-all hover:shadow-md">
                                        <CardContent className="p-5 space-y-4">
                                            <div>
                                                <h3 className="text-lg font-bold leading-tight">{employee.fullName}</h3>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    {employee.phone}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-sm font-medium text-primary">
                                                    <MapPin className="h-3 w-3" />
                                                    {employee.mainPvzName || 'ПВЗ не назначен'}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {col.id !== 'signing' ? (
                                                    <Button
                                                        className="flex-1 gap-2"
                                                        onClick={() => handleStatusUpdate(employee.id, col.id === 'new' ? 'review' : 'signing')}
                                                    >
                                                        Далее <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() => router.push(`/hr/employees/${employee.id}`)}
                                                    >
                                                        Оформить <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleStatusUpdate(employee.id, 'fired')}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {colEmployees.length === 0 && (
                                    <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                                        Нет кандидатов
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
