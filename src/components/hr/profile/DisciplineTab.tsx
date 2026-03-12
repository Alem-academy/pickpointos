import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Award, AlertTriangle } from "lucide-react";

export function DisciplineTab({ employeeId, hiredAt }: { employeeId: string, hiredAt: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [bonusInfo, setBonusInfo] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const recs = await api.getDisciplineRecords(employeeId);
                setRecords(recs);

                // Calculate bonus locally for now
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
            {/* Bonus Card */}
            {bonusInfo && (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Бонус за стаж</h3>
                            <p className="text-sm text-muted-foreground">Стаж работы: {bonusInfo.tenureMonths} мес.</p>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Текущий бонус</p>
                            <p className="text-2xl font-black text-green-600">{bonusInfo.currentBonus.toLocaleString()} ₸</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Следующий уровень</p>
                            <p className="text-2xl font-black text-slate-900">{bonusInfo.nextBonus.amount.toLocaleString()} ₸</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>Прогресс</span>
                            <span>Осталось {bonusInfo.nextBonus.monthsLeft} мес.</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="absolute left-0 top-0 h-full bg-yellow-400 transition-all duration-1000"
                                style={{ width: `${Math.min(100, (bonusInfo.tenureMonths / (bonusInfo.tenureMonths + bonusInfo.nextBonus.monthsLeft)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Discipline Records */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-bold text-lg">История взысканий</h3>
                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Award className="h-12 w-12 text-slate-200 mb-2" />
                        <p>Нарушений нет. Отличная работа!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map(record => (
                            <div key={record.id} className="flex items-start gap-4 rounded-xl border p-4 bg-red-50/50 border-red-100">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-red-900">{record.reason}</span>
                                        <span className="rounded bg-white px-2 py-0.5 text-xs font-bold uppercase border shadow-sm">{record.type}</span>
                                    </div>
                                    <p className="text-sm text-red-700 mt-1">{record.date}</p>
                                    {record.comment && <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border border-red-100">{record.comment}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
