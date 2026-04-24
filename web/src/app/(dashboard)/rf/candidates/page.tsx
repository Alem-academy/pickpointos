"use client";

import { useState, useEffect } from 'react';
import { api, type Employee } from '@/services/api';
import { CandidateForm } from '@/components/rf/candidate-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadCandidates = async () => {
        try {
            // Fetch employees with status 'new' for the current PVZ
            const data = await api.getEmployees({ pvzId: 'PVZ-001', status: 'new' });
            setCandidates(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCandidates();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Кандидаты</h1>
                <p className="text-muted-foreground">Подача заявок на новых сотрудников</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Form Section */}
                <Card className="border-2 border-primary/10 shadow-md h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Новая заявка
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CandidateForm onSuccess={loadCandidates} />
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="border-2 border-slate-100 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            На рассмотрении
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : candidates.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                Нет активных заявок
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {candidates.map((candidate) => (
                                    <div
                                        key={candidate.id}
                                        className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-slate-50"
                                    >
                                        <div>
                                            <div className="font-bold">{candidate.fullName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(candidate.createdAt), 'dd.MM.yyyy')}
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                            Ожидает HR
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
