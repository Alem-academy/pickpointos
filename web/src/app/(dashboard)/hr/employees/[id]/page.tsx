"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type Employee, type PVZ } from "@/services/api";
import { DocumentsList } from "@/components/hr/documents-list";
import { TransferModal } from "@/components/hr/transfer-modal";
import { TerminationModal } from "@/components/hr/termination-modal";
import {
    ArrowLeft,
    FileText,
    Clock,
    MapPin,
    Phone,
    Mail,
    Calendar,
    User,
    ArrowRight,
    UserX,
    AlertTriangle,
    Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const STATUS_LABELS = {
    new: 'Новый',
    review: 'На проверке',
    revision: 'Доработка',
    signing: 'Подписание',
    active: 'Активен',
    fired: 'Уволен',
} as const;

const STATUS_COLORS = {
    new: 'text-blue-600 bg-blue-50 border-blue-200',
    review: 'text-amber-600 bg-amber-50 border-amber-200',
    revision: 'text-orange-600 bg-orange-50 border-orange-200',
    signing: 'text-purple-600 bg-purple-50 border-purple-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    fired: 'text-slate-600 bg-slate-50 border-slate-200',
} as const;

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [pvz, setPvz] = useState<PVZ | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);

    useEffect(() => {
        const loadEmployee = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const emp = await api.getEmployee(id);
                setEmployee(emp);

                if (emp.mainPvzId) {
                    const pvzList = await api.getPvzList();
                    const foundPvz = pvzList.find(p => p.id === emp.mainPvzId);
                    setPvz(foundPvz || null);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load employee");
            } finally {
                setIsLoading(false);
            }
        };
        loadEmployee();
    }, [id]);

    const handleTransfer = async (pvzId: string, date: string, comment: string) => {
        if (!employee) return;
        try {
            await api.transferEmployee(employee.id, pvzId, date, comment);
            setShowTransferModal(false);
            toast.success('Сотрудник успешно переведён');
            const updated = await api.getEmployee(id);
            setEmployee(updated);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка перевода');
        }
    };

    const handleTermination = async (reason: string, date: string, comment: string) => {
        console.log('Termination:', { reason, date, comment });
        setShowTerminationModal(false);
        // Implement real termination API call here if available, for now just toast
        toast.success(`Сотрудник уволен`);
        router.push('/hr/employees');
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8">
                <p className="text-muted-foreground">Сотрудник не найден</p>
                <Button
                    variant="link"
                    onClick={() => router.push('/hr/employees')}
                    className="mt-4"
                >
                    Вернуться к списку
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/hr/employees')}
                    className="gap-2 text-muted-foreground hover:text-foreground pl-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад к списку
                </Button>

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                            {employee.fullName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{employee.fullName}</h1>
                            <p className="text-muted-foreground">{employee.position}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge
                            variant="outline"
                            className={cn("px-3 py-1 text-sm font-medium", STATUS_COLORS[employee.status])}
                        >
                            {STATUS_LABELS[employee.status]}
                        </Badge>

                        {employee.status === 'active' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowTransferModal(true)}
                                    className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Перевести
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowTerminationModal(true)}
                                    className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5"
                                >
                                    <UserX className="h-4 w-4" />
                                    Уволить
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
                    <TabsTrigger
                        value="general"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Общие данные
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        История
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Документы
                    </TabsTrigger>
                    <TabsTrigger
                        value="discipline"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Дисциплина
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6 max-w-4xl">
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Контактная информация</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Телефон</p>
                                        <p className="font-medium">{employee.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium">{employee.email || '—'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Место работы</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">ПВЗ</p>
                                        <p className="font-medium">{pvz?.name || '—'}</p>
                                        {pvz && <p className="text-sm text-muted-foreground">{pvz.address}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Должность</p>
                                        <p className="font-medium">{employee.position}</p>
                                    </div>
                                </div>
                                {employee.baseRate && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Ставка</p>
                                            <p className="font-medium">{employee.baseRate} ₽/смена</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Даты</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Дата найма</p>
                                        <p className="font-medium">{employee.hiredAt ? new Date(employee.hiredAt).toLocaleDateString('ru-RU') : '—'}</p>
                                    </div>
                                </div>
                                {employee.firedAt && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Дата увольнения</p>
                                            <p className="font-medium">{new Date(employee.firedAt).toLocaleDateString('ru-RU')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Временная шкала</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 w-px bg-border mt-2" />
                                    </div>
                                    <div className="flex-1 pb-6">
                                        <p className="font-medium">Принят на работу</p>
                                        <p className="text-sm text-muted-foreground">{employee.hiredAt ? new Date(employee.hiredAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
                                        <p className="mt-1 text-sm">Должность: {employee.position}</p>
                                        <p className="text-sm text-muted-foreground">ПВЗ: {pvz?.name || '—'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">Создана заявка</p>
                                        <p className="text-sm text-muted-foreground">HR-менеджер инициировал процесс найма</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardContent className="pt-6">
                                <DocumentsList
                                    employeeId={employee.id}
                                    employeeStatus={employee.status}
                                    onStatusChange={() => {
                                        // Refresh logic
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="discipline">
                        <DisciplineTabContent employeeId={employee.id} hiredAt={employee.hiredAt || new Date().toISOString()} />
                    </TabsContent>
                </div>
            </Tabs>

            {showTransferModal && (
                <TransferModal
                    employeeName={employee.fullName}
                    currentPvzId={employee.currentPvzId || employee.mainPvzId || ''}
                    onClose={() => setShowTransferModal(false)}
                    onConfirm={handleTransfer}
                />
            )}

            {showTerminationModal && (
                <TerminationModal
                    employeeName={employee.fullName}
                    onClose={() => setShowTerminationModal(false)}
                    onConfirm={handleTermination}
                />
            )}
        </div>
    );
}

function DisciplineTabContent({ employeeId, hiredAt }: { employeeId: string, hiredAt: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [bonusInfo, setBonusInfo] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const recs = await api.getDisciplineRecords(employeeId);
                setRecords(recs);

                const hireDate = new Date(hiredAt);
                const now = new Date();
                const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

                let bonus = 0;
                let nextBonus = 0;
                let monthsToNext = 0;

                if (months >= 36) { bonus = 100000; }
                else if (months >= 24) { bonus = 50000; nextBonus = 100000; monthsToNext = 36 - months; }
                else if (months >= 12) { bonus = 20000; nextBonus = 50000; monthsToNext = 24 - months; }
                else if (months >= 6) { bonus = 15000; nextBonus = 20000; monthsToNext = 12 - months; }
                else { nextBonus = 15000; monthsToNext = 6 - months; }

                setBonusInfo({
                    tenureMonths: months,
                    currentBonus: bonus,
                    nextBonus: { amount: nextBonus, monthsLeft: monthsToNext }
                });
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, [employeeId, hiredAt]);

    return (
        <div className="space-y-6">
            {bonusInfo && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                                <Award className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Бонус за стаж</h3>
                                <p className="text-sm text-muted-foreground">Стаж: {bonusInfo.tenureMonths} мес.</p>
                            </div>
                        </div>

                        <div className="mb-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Текущий бонус:</span>
                                <span className="font-bold text-green-600">{bonusInfo.currentBonus.toLocaleString()} ₸</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Следующий уровень:</span>
                                <span className="font-bold">{bonusInfo.nextBonus.amount.toLocaleString()} ₸</span>
                            </div>
                        </div>

                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="absolute left-0 top-0 h-full bg-yellow-400 transition-all"
                                style={{ width: `${Math.min(100, (bonusInfo.tenureMonths / (bonusInfo.tenureMonths + bonusInfo.nextBonus.monthsLeft)) * 100)}%` }}
                            />
                        </div>
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                            До следующего уровня: {bonusInfo.nextBonus.monthsLeft} мес.
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>История взысканий</CardTitle>
                </CardHeader>
                <CardContent>
                    {records.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Взысканий нет</p>
                    ) : (
                        <div className="space-y-4">
                            {records.map(record => (
                                <div key={record.id} className="flex items-start gap-4 rounded-lg border p-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{record.reason}</span>
                                            <Badge variant="secondary" className="text-xs font-bold uppercase">{record.type}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{record.date}</p>
                                        {record.comment && <p className="mt-1 text-sm">{record.comment}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
