import { Users, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface HRStatsCardsProps {
    totalEmployees?: number;
    activeEmployees?: number;
    newCandidates?: number;
    documentsPending?: number;
    documentsSigned?: number;
    onboardingProgress?: number;
}

export function HRStatsCards({
    totalEmployees = 0,
    activeEmployees = 0,
    newCandidates = 0,
    documentsPending = 0,
    documentsSigned = 0,
    onboardingProgress = 0
}: HRStatsCardsProps) {
    const stats = [
        {
            title: 'Всего сотрудников',
            value: totalEmployees,
            icon: Users,
            color: 'blue',
            trend: '+12%'
        },
        {
            title: 'Активные',
            value: activeEmployees,
            icon: CheckCircle,
            color: 'emerald',
            trend: `${Math.round((activeEmployees / totalEmployees) * 100)}%`
        },
        {
            title: 'Новые кандидаты',
            value: newCandidates,
            icon: Clock,
            color: 'amber',
            trend: newCandidates > 0 ? 'Требуют внимания' : 'Все обработаны'
        },
        {
            title: 'Документы на подписании',
            value: documentsPending,
            icon: FileText,
            color: 'purple',
            trend: `${documentsSigned} подписано`
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div 
                        key={index}
                        className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </p>
                                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                                <p className={`text-xs mt-2 font-medium ${
                                    stat.color === 'emerald' ? 'text-emerald-600' :
                                    stat.color === 'amber' ? 'text-amber-600' :
                                    stat.color === 'purple' ? 'text-purple-600' :
                                    'text-blue-600'
                                }`}>
                                    {stat.trend}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${
                                stat.color === 'emerald' ? 'bg-emerald-100' :
                                stat.color === 'amber' ? 'bg-amber-100' :
                                stat.color === 'purple' ? 'bg-purple-100' :
                                'bg-blue-100'
                            }`}>
                                <Icon className={`h-6 w-6 ${
                                    stat.color === 'emerald' ? 'text-emerald-600' :
                                    stat.color === 'amber' ? 'text-amber-600' :
                                    stat.color === 'purple' ? 'text-purple-600' :
                                    'text-blue-600'
                                }`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
