import { useEffect, useState } from 'react';
import { hrApi } from '@/api/hr';
import { Loader2, MoveRight, FileText, Calendar, User, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLog {
    id: string;
    employee_id: string;
    action_type: string;
    action_category: string;
    title: string;
    description: string;
    metadata: any;
    performed_by_name: string;
    created_at: string;
}

interface HistoryTabProps {
    employeeId: string;
}

export function HistoryTab({ employeeId }: HistoryTabProps) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, [employeeId]);

    const loadActivities = async () => {
        try {
            setIsLoading(true);

            // Load activity logs using hrApi
            const activities: ActivityLog[] = await hrApi.getEmployeeActivity(employeeId);

            setActivities(activities);
        } catch (err) {
            console.error('Failed to load activities:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getIconForAction = (actionType: string) => {
        switch (actionType) {
            case 'document_generated':
            case 'document_signed':
            case 'document_deleted':
                return FileText;
            case 'transfer':
                return MoveRight;
            case 'status_changed':
                return Edit2;
            case 'hired':
                return User;
            default:
                return Calendar;
        }
    };

    const getColorForAction = (actionType: string) => {
        switch (actionType) {
            case 'document_generated':
            case 'document_signed':
                return 'bg-blue-100 text-blue-600';
            case 'transfer':
                return 'bg-purple-100 text-purple-600';
            case 'status_changed':
                return 'bg-amber-100 text-amber-600';
            case 'hired':
                return 'bg-emerald-100 text-emerald-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">История пуста</p>
                <p className="text-slate-400 text-sm mt-1">Здесь будут отображаться все действия с сотрудником</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />
                
                {/* Activity items */}
                <div className="space-y-6">
                    {activities.map((activity) => {
                        const Icon = getIconForAction(activity.action_type);
                        const color = getColorForAction(activity.action_type);
                        
                        return (
                            <div key={activity.id} className="relative flex gap-4">
                                {/* Icon */}
                                <div className={cn(
                                    "relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm",
                                    color
                                )}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 pt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-slate-900">{activity.title}</h3>
                                        <span className="text-xs text-slate-500">
                                            {new Date(activity.created_at).toLocaleDateString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-1">{activity.description}</p>
                                    {activity.performed_by_name && (
                                        <p className="text-xs text-slate-400">
                                            HR: {activity.performed_by_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
