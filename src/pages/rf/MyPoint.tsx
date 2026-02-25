import { MapPin, Box, CheckSquare, Info } from "lucide-react";
import { useRFStats } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyPoint() {
    const { data: stats, isLoading, error } = useRFStats();

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-background/50">
                <PageHeader
                    title="Моя Точка (ПВЗ)"
                    description="Детализация по вашему ПВЗ"
                    breadcrumbs={[{ label: "Мой ПВЗ", path: "/rf" }, { label: "Детали" }]}
                />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </div>
        );
    }

    if (error || !stats?.pvz) {
        return (
            <div className="flex flex-col h-full bg-background/50">
                <PageHeader
                    title="Моя Точка (ПВЗ)"
                    description="Детализация по вашему ПВЗ"
                    breadcrumbs={[{ label: "Мой ПВЗ", path: "/rf" }, { label: "Детали" }]}
                />
                <div className="flex-1 p-6">
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="font-bold text-lg">ПВЗ не найден</h3>
                        </div>
                        <p className="text-sm text-destructive/80">
                            {(error as Error)?.message || "У вашего аккаунта нет прикрепленного ПВЗ."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const { pvz, todayShift } = stats;

    return (
        <div className="flex flex-col h-full bg-background/50">
            <PageHeader
                title={pvz.name}
                description="Управление локацией и отчетность"
                breadcrumbs={[{ label: "Мой ПВЗ", path: "/rf" }, { label: "Детали" }]}
            />

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Information Card */}
                    <div className="rounded-xl border bg-card shadow-sm h-full flex flex-col">
                        <div className="border-b p-5 flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2.5">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold">Общая Информация</h3>
                        </div>
                        <div className="p-6 space-y-6 flex-1">
                            <div className="flex gap-4 items-start">
                                <div className="mt-0.5 rounded-full bg-muted p-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Адрес пункта</h4>
                                    <p className="font-medium text-sm text-card-foreground leading-snug">{pvz.address}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-0.5 rounded-full bg-muted p-2">
                                    <Box className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Бренд сети</h4>
                                    <p className="font-medium text-sm text-card-foreground">{pvz.brand || 'Wildberries'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shift & Staff Logic */}
                    <div className="rounded-xl border bg-card shadow-sm h-full flex flex-col">
                        <div className="border-b p-5 flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-100 p-2.5">
                                <CheckSquare className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold">Смена и Персонал</h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            {todayShift && todayShift.length > 0 ? (
                                <div className="space-y-3 flex-1 overflow-y-auto">
                                    {todayShift.map((emp) => (
                                        <div key={emp.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100/50">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
                                                {emp.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-emerald-950">{emp.full_name}</p>
                                                <p className="text-xs font-medium text-emerald-700/80 uppercase tracking-wider">{emp.role?.toUpperCase() || 'N/A'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg text-center bg-muted/20">
                                    <p className="text-sm font-medium text-muted-foreground">На сегодня смен нет</p>
                                </div>
                            )}
                            <div className="mt-6">
                                <Button className="w-full" variant="outline">Смотреть График</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Checklist Placeholder */}
                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="border-b px-6 py-5">
                        <h3 className="font-semibold">Утренний Чек-лист Открытия</h3>
                        <p className="text-xs text-muted-foreground mt-1">Обязательные действия до приема клиентов</p>
                    </div>
                    <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-muted/10">
                        {[
                            { label: 'Уборка помещения', id: 'clean' },
                            { label: 'Проверка вывески', id: 'sign' },
                            { label: 'Касса и терминал', id: 'cash' },
                            { label: 'Наличие коробок', id: 'boxes' }
                        ].map((item) => (
                            <label key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors cursor-pointer group">
                                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer" />
                                <span className="text-sm font-medium group-hover:text-foreground/80">{item.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
