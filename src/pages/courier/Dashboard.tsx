import { useState, useEffect } from "react";
import { PlayCircle, StopCircle, Clock, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function CourierDashboard() {
    // Mock state for the courier shift
    const [isShiftActive, setIsShiftActive] = useState(false);
    const [shiftDuration, setShiftDuration] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isShiftActive) {
            interval = setInterval(() => {
                setShiftDuration(prev => prev + 1);
            }, 60000); // ++ every minute for demo
        }
        return () => clearInterval(interval);
    }, [isShiftActive]);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}ч ${m}м`;
    };

    const handleShiftToggle = () => {
        if (isShiftActive) {
            // End shift logic
            setIsShiftActive(false);
        } else {
            // Start shift logic
            setIsShiftActive(true);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Mobile Header */}
            <header className="bg-primary text-primary-foreground px-6 py-8 rounded-b-[2rem] shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MapPin className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <p className="text-primary-foreground/80 text-sm font-medium mb-1">
                        {format(new Date(), "EEEE, d MMMM", { locale: ru })}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight">Привет, Курьер!</h1>
                    <p className="text-primary-foreground/90 mt-2 font-medium">Ваша смена на сегодня</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {/* Main Action Card */}
                <div className="bg-background rounded-2xl shadow-sm border p-6 flex flex-col items-center justify-center text-center">
                    <div className="mb-6">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Статус смены</p>
                        <h2 className={`text-2xl font-black ${isShiftActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isShiftActive ? 'АКТИВНА' : 'ОЖИДАНИЕ'}
                        </h2>
                        {isShiftActive && (
                            <p className="text-3xl font-mono font-bold mt-4 tracking-tighter">
                                {formatDuration(shiftDuration)}
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleShiftToggle}
                        className={`w-full h-16 rounded-xl text-lg font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${isShiftActive
                            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground hover:shadow-destructive/20'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/20'
                            }`}
                    >
                        {isShiftActive ? (
                            <>
                                <StopCircle className="mr-3 h-6 w-6" /> Завершить смену
                            </>
                        ) : (
                            <>
                                <PlayCircle className="mr-3 h-6 w-6" /> Начать смену
                            </>
                        )}
                    </Button>
                </div>

                {/* Info Cards Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-2xl shadow-sm border p-5">
                        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">График</span>
                        </div>
                        <p className="font-bold text-lg leading-tight">10:00 - 20:00</p>
                        <p className="text-xs text-muted-foreground mt-1">Сегодня</p>
                    </div>
                    <div className="bg-background rounded-2xl shadow-sm border p-5">
                        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                            <MapPin className="w-5 h-5 text-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Локация</span>
                        </div>
                        <p className="font-bold text-lg leading-tight">ПВЗ Абай</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">ул. Абая 150</p>
                    </div>
                </div>

                {/* Stats / Earnings */}
                <div className="bg-background rounded-2xl shadow-sm border mt-4">
                    <div className="p-5 flex items-center justify-between border-b">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold">Мой заработок</h3>
                                <p className="text-xs text-muted-foreground">За текущий месяц</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="p-5 flex items-center justify-between bg-muted/10 rounded-b-2xl">
                        <span className="text-sm font-medium text-muted-foreground">Ориентировочно</span>
                        <span className="text-2xl font-black text-emerald-600">145 000 ₸</span>
                    </div>
                </div>

                {/* Upcoming Schedule Preview */}
                <div className="bg-background rounded-2xl shadow-sm border p-5 mt-4">
                    <h3 className="font-bold mb-4">Ближайшие смены</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="font-bold text-sm">Завтра, 25 Марта</p>
                                <p className="text-xs text-muted-foreground">10:00 - 20:00 • ПВЗ Абай</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="font-bold text-sm">Среда, 26 Марта</p>
                                <p className="text-xs text-muted-foreground">10:00 - 20:00 • ПВЗ Достык</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                    </div>
                </div>

                {/* Spacer for bottom navigation */}
                <div className="h-20"></div>
            </div>
        </div>
    );
}
