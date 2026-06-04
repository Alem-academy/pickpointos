import type { Employee } from '@/services/api';
import { MapPin, Phone, Mail, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeHeroProps {
    employee: Employee;
    photoUrl?: string;
    onEdit?: () => void;
}

const STATUS_LABELS = {
    new: 'Новый',
    review: 'На проверке',
    revision: 'Доработка',
    signing: 'Подписание',
    active: 'Активен',
    fired: 'Уволен',
} as const;

const STATUS_COLORS = {
    new: 'text-blue-600 bg-blue-50 border-blue-200',
    review: 'text-amber-600 bg-amber-50 border-amber-200',
    revision: 'text-orange-600 bg-orange-50 border-orange-200',
    signing: 'text-purple-600 bg-purple-50 border-purple-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    fired: 'text-slate-600 bg-slate-50 border-slate-200',
} as const;

function getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

export function EmployeeHero({ employee, photoUrl, onEdit }: EmployeeHeroProps) {
    const status = employee.status as keyof typeof STATUS_LABELS;
    const statusLabel = STATUS_LABELS[status] || employee.status;
    const statusColor = STATUS_COLORS[status] || STATUS_COLORS.new;

    return (
        <div className="relative">
            {/* Cover Photo / Gradient Header */}
            <div className="relative h-48 overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />

                {/* Quick Actions */}
                <div className="absolute right-4 top-4 flex items-center gap-2">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                            aria-label="Редактировать профиль"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Status Badge */}
                <div className="absolute right-4 top-16">
                    <span className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-md",
                        statusColor
                    )}>
                        {statusLabel}
                    </span>
                </div>
            </div>

            {/* Avatar & Basic Info */}
            <div className="relative -mt-16 px-6 pb-6">
                <div className="flex items-end gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={employee.full_name}
                                className="h-32 w-32 rounded-2xl border-4 border-white object-cover shadow-xl"
                            />
                        ) : (
                            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl font-bold text-white shadow-xl">
                                {getInitials(employee.full_name)}
                            </div>
                        )}
                        
                        {/* Role Badge */}
                        <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-1.5 shadow-lg">
                            {employee.role === 'rf' ? (
                                <Briefcase className="h-4 w-4 text-indigo-600" />
                            ) : (
                                <MapPin className="h-4 w-4 text-blue-600" />
                            )}
                        </div>
                    </div>

                    {/* Name & Role */}
                    <div className="flex-1 pb-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            {employee.full_name}
                        </h1>
                        <p className="text-sm font-medium text-slate-600">
                            {employee.role === 'rf' ? 'Региональный менеджер' : 'Менеджер по работе с клиентами'}
                        </p>
                        {employee.main_pvz_name && (
                            <p className="text-xs text-slate-500">
                                {employee.main_pvz_name}
                            </p>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="hidden md:flex items-center gap-6 pb-2">
                        <div className="text-center">
                            <div className="text-xs font-medium text-slate-500">ИИН</div>
                            <div className="font-mono text-sm font-semibold text-slate-700">
                                {employee.iin}
                            </div>
                        </div>
                        {employee.phone && (
                            <div className="text-center">
                                <div className="text-xs font-medium text-slate-500">Телефон</div>
                                <div className="text-sm font-semibold text-slate-700">
                                    {employee.phone}
                                </div>
                            </div>
                        )}
                        {employee.email && (
                            <div className="text-center">
                                <div className="text-xs font-medium text-slate-500">Email</div>
                                <div className="text-sm font-semibold text-slate-700">
                                    {employee.email}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Quick Info */}
                <div className="mt-4 flex flex-wrap gap-3 md:hidden">
                    {employee.phone && (
                        <a 
                            href={`tel:${employee.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        >
                            <Phone className="h-3.5 w-3.5" />
                            Позвонить
                        </a>
                    )}
                    {employee.email && (
                        <a 
                            href={`mailto:${employee.email}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        >
                            <Mail className="h-3.5 w-3.5" />
                            Написать
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
