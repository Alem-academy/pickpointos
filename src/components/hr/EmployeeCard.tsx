import { useState } from 'react';
import { User, MapPin, Phone, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeCardProps {
    id: string;
    fullName: string;
    role: string;
    status: 'new' | 'review' | 'revision' | 'signing' | 'active' | 'fired';
    pvzName?: string;
    phone?: string;
    email?: string;
    hiredAt?: string;
    onClick?: () => void;
}

export function EmployeeCard({
    id,
    fullName,
    role,
    status,
    pvzName,
    phone,
    email,
    hiredAt,
    onClick
}: EmployeeCardProps) {
    const statusConfig = {
        new: { label: 'Новый', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        review: { label: 'На рассмотрении', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        revision: { label: 'На доработке', color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        signing: { label: 'Подписание', color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        active: { label: 'Активный', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        fired: { label: 'Уволен', color: 'gray', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
    };

    const currentStatus = statusConfig[status];

    return (
        <div 
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer",
                "hover:-translate-y-0.5"
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2.5 rounded-xl",
                        status === 'active' ? "bg-emerald-100" :
                        status === 'new' ? "bg-blue-100" :
                        status === 'signing' ? "bg-purple-100" :
                        "bg-gray-100"
                    )}>
                        <User className={cn(
                            "h-5 w-5",
                            status === 'active' ? "text-emerald-600" :
                            status === 'new' ? "text-blue-600" :
                            status === 'signing' ? "text-purple-600" :
                            "text-gray-600"
                        )} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {fullName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{role}</p>
                    </div>
                </div>
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                    currentStatus.bg,
                    currentStatus.text,
                    currentStatus.border
                )}>
                    {currentStatus.label}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                {pvzName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{pvzName}</span>
                    </div>
                )}
                {phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{phone}</span>
                    </div>
                )}
                {email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{email}</span>
                    </div>
                )}
            </div>

            {status === 'revision' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Требует доработки</span>
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                    {hiredAt ? `Нанят: ${hiredAt}` : 'Не нанят'}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
}
