import { useNavigate } from "react-router-dom";
import { Users, UserPlus, FileText, ArrowUpRight, ArrowDownRight, Briefcase, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHRStats } from "@/hooks/use-queries";

export default function HRDashboard() {
    const navigate = useNavigate();
    const { data: stats, isLoading, error } = useHRStats();

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Загрузка HR аналитики...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700">Ошибка загрузки</CardTitle>
                        <CardDescription className="text-red-600">
                            {(error as Error).message || "Не удалось загрузить данные. Попробуйте снова."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()} variant="outline" className="bg-white">
                            Повторить
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-slate-50/50 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">HR Дашборд</h2>
                    <p className="text-slate-500">Обзор сотрудников, найма и активности.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/hr/applications')}>
                        К Заявкам
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/hr/employees')}>
                        Сотрудники
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего сотрудников</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">+2%</span> с прошлого месяца
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Новые (Месяц)</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.newHiresThisMonth || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">+4</span> на этой неделе
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ожидают проверки</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pendingApplications || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowDownRight className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-500">Требует внимания</span>
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Вакансии</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="text-slate-500">В 2 ПВЗ</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Активность</CardTitle>
                        <CardDescription>
                            Последние изменения статусов и найм.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {Array.isArray(stats?.recentActivity) && stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((act) => (
                                    <div key={act.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                                {act?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{act.full_name || 'Неизвестный'}</p>
                                                <p className="text-xs text-muted-foreground">{act.role?.toUpperCase() || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Нанят: {act.hired_at ? new Date(act.hired_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Нет активности.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Быстрые действия</CardTitle>
                        <CardDescription>Частые задачи HR</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/hr/applications')}>
                            <FileText className="mr-2 h-4 w-4" />
                            Просмотр Заявок
                        </Button>
                        <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/hr/employees')}>
                            <Users className="mr-2 h-4 w-4" />
                            База Сотрудников
                        </Button>
                        <Button variant="secondary" className="w-full justify-start" onClick={async () => {
                            if (!confirm('Запустить синхронизацию данных из Google Sheets? Это может занять время.')) return;
                            try {
                                await import('@/services/api').then(m => m.api.triggerParser());
                                alert('Синхронизация успешно запущена!');
                                window.location.reload();
                            } catch (e) {
                                alert('Ошибка синхронизации: ' + (e as Error).message);
                            }
                        }}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Синхронизировать Данные
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
