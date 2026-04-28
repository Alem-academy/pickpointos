import { useState, useEffect, useRef } from 'react';
import { Bell, FileText, CheckCircle, UserPlus, Edit2, Loader2, X } from 'lucide-react';
import { api } from '@/services/api';
import { Tooltip } from '@/components/ui/Tooltip';

interface ActivityItem {
    id: string;
    employee_name?: string;
    action_type: string;
    title: string;
    description: string;
    created_at: string;
    performed_by_name?: string;
}

export function NotificationBell() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadActivities = async () => {
        try {
            setIsLoading(true);
            const data = await api.getGlobalActivity(20, 'document');
            setActivities(data);
            // Count events from last 24 hours as "unread"
            const last24h = data.filter((a: ActivityItem) =>
                new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            );
            setUnreadCount(last24h.length);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadActivities();
        const interval = setInterval(loadActivities, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (actionType: string) => {
        switch (actionType) {
            case 'document_signed':
            case 'document_signed_employer':
                return <CheckCircle className="h-4 w-4 text-emerald-600" />;
            case 'document_generated':
                return <FileText className="h-4 w-4 text-blue-600" />;
            case 'hired':
                return <UserPlus className="h-4 w-4 text-purple-600" />;
            case 'status_changed':
                return <Edit2 className="h-4 w-4 text-amber-600" />;
            default:
                return <FileText className="h-4 w-4 text-slate-500" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        if (diffMin < 1) return 'только что';
        if (diffMin < 60) return `${diffMin} мин назад`;
        if (diffHour < 24) return `${diffHour} ч назад`;
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Tooltip text="Уведомления HR">
                <button
                    onClick={() => { setIsOpen(!isOpen); if (!isOpen) loadActivities(); }}
                    className="relative p-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                    <Bell className="h-5 w-5 text-primary" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </Tooltip>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Уведомления</h3>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                            <X className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {isLoading && activities.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500">
                                Нет уведомлений
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(activity.action_type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-900 leading-relaxed">
                                                <span className="font-semibold">
                                                    {activity.employee_name || 'Сотрудник'}
                                                </span>
                                                {' — '}{activity.title}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {formatTime(activity.created_at)}
                                                {activity.performed_by_name && (
                                                    <span className="ml-1">• {activity.performed_by_name}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {activities.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-2 text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-primary hover:underline"
                            >
                                Закрыть
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
