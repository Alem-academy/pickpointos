import { useNavigate } from "react-router-dom";
import { UserPlus, Box, Calendar, AlertTriangle, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRFStats } from "@/hooks/use-queries";
import { Skeleton } from "@/components/ui/skeleton";

export default function RFDashboard() {
    const navigate = useNavigate();
    const { data: stats, isLoading, error } = useRFStats();

    if (isLoading) {
        return (
            <div className="space-y-6 bg-slate-50/50 p-8">
                <div className="mb-8 space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-32 mb-2" />
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700">Ошибка загрузки дашборда</CardTitle>
                        <CardDescription className="text-red-600">
                            {(error as Error).message || "Не удалось получить статистику ПВЗ."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()} variant="outline" className="bg-white">
                            Retry Connection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { pvz, todayShift } = stats || {};

    return (
        <div className="space-y-6 bg-slate-50/50 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        {pvz ? pvz.name : 'Операционная Панель'}
                    </h2>
                    <p className="text-slate-500">
                        {pvz ? pvz.address : 'Управление ежедневными операциями ПВЗ'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/rf/new-hire')}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Новый Кандидат
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-600" />
                            Команда Сегодня
                        </CardTitle>
                        <CardDescription>Сотрудники на смене</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Array.isArray(todayShift) && todayShift.length > 0 ? (
                            <div className="space-y-4">
                                {todayShift.map((emp) => (
                                    <div key={emp.id} className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                            {emp.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{emp.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{emp.role}</p>
                                        </div>
                                        <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                            На смене
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 py-2">
                                Нет запланированных смен на сегодня.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Box className="h-5 w-5 text-blue-600" />
                            Расходы и Заявки
                        </CardTitle>
                        <CardDescription>Расходники и Ремонт</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Заказ пакетов, канцелярии. Заявки на ремонт (кондиционеры, мебель).
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/finance/expenses')}>
                            Создать Заявку &rarr;
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Задачи
                        </CardTitle>
                        <CardDescription>Требуется действие</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div
                                className="flex items-center justify-between cursor-pointer rounded-lg p-2 hover:bg-slate-50 transition-colors"
                                onClick={() => navigate('/operations/timesheets')}
                            >
                                <span className="text-sm font-medium">Подтвердить Табели</span>
                                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">2 ожидают</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 opacity-50">
                                <span>Утверждение Расходов</span>
                                <span className="font-bold text-slate-500">0</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Расходы за месяц (Одобрено)</CardTitle>
                    <CardDescription>Финансовый обзор за текущий месяц</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">
                        {stats?.monthlyApprovedExpenses?.toLocaleString() || 0} ₸
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
