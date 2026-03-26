import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Loader2, MoveRight, FileText, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransferRecord {
    id: string;
    employee_id: string;
    from_pvz_id: string | null;
    to_pvz_id: string;
    from_pvz_name?: string;
    to_pvz_name?: string;
    start_date: string;
    end_date?: string;
    reason?: string;
    initiated_by?: string;
    created_at: string;
}

interface StatusChange {
    id: string;
    employee_id: string;
    old_status?: string;
    new_status: string;
    changed_at: string;
    changed_by?: string;
}

interface HistoryItem {
    id: string;
    type: 'transfer' | 'status_change' | 'document';
    date: string;
    title: string;
    description: string;
    icon: any;
    color: string;
}

interface HistoryTabProps {
    employeeId: string;
    hiredAt?: string;
}

export function HistoryTab({ employeeId, hiredAt }: HistoryTabProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [employeeId]);

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            
            // Load transfers
            const transfersRes = await api.get(`/employees/${employeeId}/transfers`);
            const transfers: TransferRecord[] = transfersRes.data || [];
            
            // Load employee to get current status
            const employeeRes = await api.get(`/employees/${employeeId}`);
            const employee = employeeRes.data;
            
            // Build history timeline
            const historyItems: HistoryItem[] = [];
            
            // Add hiring event
            if (hiredAt) {
                historyItems.push({
                    id: 'hired',
                    type: 'status_change',
                    date: hiredAt,
                    title: 'Принят на работу',
                    description: employee.main_pvz_name ? `ПВЗ: ${employee.main_pvz_name}` : 'Сотрудник',
                    icon: User,
                    color: 'bg-emerald-100 text-emerald-600'
                });
            }
            
            // Add transfers
            transfers.forEach(transfer => {
                historyItems.push({
                    id: transfer.id,
                    type: 'transfer',
                    date: transfer.start_date,
                    title: 'Перевод на другой ПВЗ',
                    description: `${transfer.from_pvz_name || 'Не указан'} → ${transfer.to_pvz_name || 'Не указан'}`,
                    icon: MoveRight,
                    color: 'bg-blue-100 text-blue-600'
                });
            });
            
            // Sort by date (newest first)
            historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setHistory(historyItems);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">История пуста</p>
                <p className="text-slate-400 text-sm mt-1">Здесь будут отображаться переводы и изменения статуса</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />
                
                {/* History items */}
                <div className="space-y-6">
                    {history.map((item, index) => {
                        const Icon = item.icon;
                        const isLast = index === history.length - 1;
                        
                        return (
                            <div key={item.id} className="relative flex gap-4">
                                {/* Icon */}
                                <div className={cn(
                                    "relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm",
                                    item.color
                                )}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 pt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                                        <span className="text-xs text-slate-500">
                                            {new Date(item.date).toLocaleDateString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
