import { useNavigate } from "react-router-dom";
import { UserPlus, Box, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRFStats } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function RFDashboard() {
    const navigate = useNavigate();
    const { data: stats, isLoading, error } = useRFStats();

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-background/50">
                <PageHeader
                    title="Операционная Панель"
                    description="Управление ежедневными операциями ПВЗ"
                    breadcrumbs={[{ label: "Мой ПВЗ", path: "/rf" }, { label: "Дашборд" }]}
                />
                <div className="flex-1 p-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
                                <div className="h-6 w-1/2 bg-muted rounded mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-10 bg-muted/50 rounded"></div>
                                    <div className="h-10 bg-muted/50 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full bg-background/50">
                <PageHeader
                    title="Операционная Панель"
                    description="Произошла ошибка загрузки данных"
                    breadcrumbs={[{ label: "Мой ПВЗ", path: "/rf" }, { label: "Дашборд" }]}
                />
                <div className="flex-1 p-6">
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="font-bold text-lg">Ошибка соединения</h3>
                        </div>
                        <p className="text-sm text-destructive/80 mb-6">
                            {(error as Error).message || "Не удалось получить статистику ПВЗ."}
                        </p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="bg-background">
                            Повторить попытку
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const { pvz, todayShift } = stats || {};

    return (
        <div className="flex flex-col h-full bg-background/50">
            <PageHeader
                title={pvz ? pvz.name : 'Операционная Панель'}
                description={pvz ? pvz.address : 'Управление ежедневными операциями ПВЗ'}
                breadcrumbs={[{ label: "Мой ПВЗ", path: "/rf" }, { label: "Главная" }]}
                action={
                    <Button className="gap-2 shadow-md" onClick={() => navigate('/rf/new-hire')}>
                        <UserPlus className="h-4 w-4" />
                        Новый Кандидат
                    </Button>
                }
            />

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Shift Card */}
                    <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="border-b p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-100 p-2.5">
                                    <Calendar className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold leading-none">Команда Сегодня</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(), 'd MMMM, EEEE', { locale: ru })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 flex-1 min-h-0 overflow-y-auto bg-muted/20">
                            {Array.isArray(todayShift) && todayShift.length > 0 ? (
                                <div className="space-y-3">
                                    {todayShift.map((emp) => (
                                        <div key={emp.id} className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                                {emp.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-card-foreground">{emp.full_name}</p>
                                                <p className="truncate text-xs text-muted-foreground capitalize">{emp.role}</p>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                На смене
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/50 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">Нет активных смен на сегодня</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operations Card */}
                    <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="border-b p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2.5">
                                    <Box className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold leading-none">Заявки ПВЗ</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Обеспечение жизнедеятельности</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                Заказ курьерских пакетов, канцелярии для офиса. Оформление заявок на ремонт кондиционеров, замену мебели и другие хоз. нужды.
                            </p>
                            <Button variant="outline" className="w-full justify-between group" onClick={() => navigate('/finance/expenses')}>
                                Создать Заявку
                                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>

                    {/* Tasks Card */}
                    <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="border-b p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-100 p-2.5">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold leading-none">Задачи</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Требуют вашего внимания</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 flex-1">
                            <div className="space-y-3">
                                <div
                                    className="group flex cursor-pointer items-center justify-between rounded-lg border bg-background p-3 transition-colors hover:border-amber-300 hover:bg-amber-50/50"
                                    onClick={() => navigate('/operations/timesheets')}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-100 text-amber-600">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-semibold group-hover:text-amber-900 transition-colors">Подтвердить Табели</span>
                                    </div>
                                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">2 ждут</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
                                            <Box className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">Утверждение Расходов</span>
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expenses Summary */}
                <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold">Расходы за месяц (Одобрено)</h3>
                        <p className="text-sm text-muted-foreground mt-1">Одобренные затраты вашего ПВЗ в текущем месяце.</p>
                    </div>
                    <div className="flex items-baseline gap-2 rounded-xl bg-slate-50 border px-6 py-4">
                        <span className="text-3xl font-black tracking-tight">{stats?.monthlyApprovedExpenses?.toLocaleString() || 0}</span>
                        <span className="text-lg font-semibold text-muted-foreground">₸</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
