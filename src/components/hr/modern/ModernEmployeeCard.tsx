import { MapPin, Phone, Mail, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernEmployeeCardProps {
    fullName: string;
    role: string;
    status: 'new' | 'review' | 'revision' | 'signing' | 'active' | 'fired';
    pvzName?: string;
    phone?: string;
    email?: string;
    hiredAt?: string;
    onClick?: () => void;
}

export function ModernEmployeeCard({ fullName, role, status, pvzName, phone, email, hiredAt, onClick }: ModernEmployeeCardProps) {
    const statusConfig: any = {
        new: { label: 'Новый', color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
        review: { label: 'На рассмотрении', color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
        revision: { label: 'На доработке', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
        signing: { label: 'Подписание', color: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
        active: { label: 'Активный', color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
        fired: { label: 'Уволен', color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50' }
    };
    const s = statusConfig[status];

    return (
        <div onClick={onClick} className={cn(
            "group relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200 shadow-sm",
            "hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer"
        )}>
            <div className={cn("absolute top-0 left-0 right-0 h-1", s.color)} />
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold", s.bg, s.text)}>{fullName.charAt(0)}</div>
                    <div><h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{fullName}</h3><p className="text-sm text-slate-500">{role}</p></div>
                </div>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", s.bg, s.text)}>
                    <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", s.color)} />{s.label}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
                {pvzName && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /><span className="truncate">{pvzName}</span></div>}
                {phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="h-4 w-4 text-slate-400" /><span>{phone}</span></div>}
                {email && <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600"><Mail className="h-4 w-4 text-slate-400" /><span className="truncate">{email}</span></div>}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">{hiredAt ? `Нанят: ${hiredAt}` : 'Не нанят'}</span>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
}
