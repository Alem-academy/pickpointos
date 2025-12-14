import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { AlertTriangle, Award, Plus } from 'lucide-react';

export default function Discipline() {
    const [activeTab, setActiveTab] = useState<'discipline' | 'motivation'>('discipline');
    const [records, setRecords] = useState<any[]>([]);
    const [bonuses, setBonuses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'discipline') {
                    const data = await api.getDisciplineRecords();
                    setRecords(data);
                } else {
                    const data = await api.getBonuses();
                    setBonuses(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [activeTab]);

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-black">Дисциплина и Мотивация</h1>
                    <p className="text-xl text-muted-foreground">Управление взысканиями и бонусами за стаж</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('discipline')}
                        className={`rounded-xl px-6 py-3 font-bold transition-colors ${activeTab === 'discipline' ? 'bg-black text-white' : 'bg-white text-black hover:bg-slate-100'}`}
                    >
                        ВЗЫСКАНИЯ
                    </button>
                    <button
                        onClick={() => setActiveTab('motivation')}
                        className={`rounded-xl px-6 py-3 font-bold transition-colors ${activeTab === 'motivation' ? 'bg-black text-white' : 'bg-white text-black hover:bg-slate-100'}`}
                    >
                        МОТИВАЦИЯ
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
                </div>
            ) : (
                <>
                    {activeTab === 'discipline' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-red-700">
                                    <Plus className="h-5 w-5" />
                                    ДОБАВИТЬ ВЗЫСКАНИЕ
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {records.map(record => (
                                    <div key={record.id} className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                                                <AlertTriangle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold">Сотрудник #{record.employeeId}</h3>
                                                <p className="text-sm text-muted-foreground">{record.date}</p>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold uppercase">{record.type}</span>
                                        </div>
                                        <p className="font-medium">{record.reason}</p>
                                        <p className="mt-2 text-sm text-muted-foreground">{record.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'motivation' && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {bonuses.map(bonus => (
                                <div key={bonus.employeeId} className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                                            <Award className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{bonus.fullName}</h3>
                                            <p className="text-sm text-muted-foreground">Стаж: {bonus.tenureMonths} мес.</p>
                                        </div>
                                    </div>

                                    <div className="mb-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Текущий бонус:</span>
                                            <span className="font-bold text-green-600">{bonus.currentBonus.toLocaleString()} ₸</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Следующий уровень:</span>
                                            <span className="font-bold">{bonus.nextBonus.amount.toLocaleString()} ₸</span>
                                        </div>
                                    </div>

                                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-yellow-400 transition-all"
                                            style={{ width: `${Math.min(100, (bonus.tenureMonths / (bonus.tenureMonths + bonus.nextBonus.monthsLeft)) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        До следующего уровня: {bonus.nextBonus.monthsLeft} мес.
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
