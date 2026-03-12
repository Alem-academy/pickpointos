import { X, FileText, User, CreditCard, Building, Calendar, Phone, CheckCircle, Mail, MapPin, FileWarning } from "lucide-react";
import type { Employee } from "@/services/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CandidateModalProps {
    candidate: Employee;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
    onRevision?: () => void;
}

export function CandidateModal({ candidate, onClose, onApprove, onReject, onRevision }: CandidateModalProps) {
    if (!candidate) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4">
                    <div>
                        <h2 className="text-xl font-bold">{candidate.full_name}</h2>
                        <span className="text-sm text-muted-foreground mt-1 block">Заявка на должность: {candidate.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 font-medium"
                            onClick={() => window.location.href = `/hr/employees/${candidate.id}`}
                        >
                            <User className="h-4 w-4" />
                            Перейти в профиль
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Key Info Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg border bg-muted/30 p-4 shadow-sm">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">ПВЗ</span>
                            </div>
                            <p className="font-semibold text-foreground">{candidate.main_pvz_name || 'Не назначен'}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1" title={candidate.main_pvz_address}>{candidate.main_pvz_address}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4 shadow-sm">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Оклад (Ставка)</span>
                            </div>
                            <p className="font-semibold text-foreground text-lg">{candidate.base_rate?.toLocaleString()} ₸</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4 shadow-sm">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Дата создания</span>
                            </div>
                            <p className="font-semibold text-foreground">{new Date(candidate.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="mb-6 rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-base font-bold">Личные данные</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <InfoRow label="ИИН" value={candidate.iin || '—'} icon={<User className="h-4 w-4" />} className="font-mono" />
                            <InfoRow label="Телефон" value={candidate.phone || '—'} icon={<Phone className="h-4 w-4" />} className="font-mono" />
                            <InfoRow label="Email" value={candidate.email || '—'} icon={<Mail className="h-4 w-4" />} />
                            <InfoRow label="Фактический адрес" value={candidate.address || 'Не указан'} icon={<MapPin className="h-4 w-4" />} />
                            <div className="md:col-span-2">
                                <InfoRow
                                    label="IBAN Счет"
                                    value={candidate.iban || 'Не указан'}
                                    icon={<CreditCard className="h-4 w-4" />}
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Documents (Mock) */}
                    <div className="mb-4">
                        <h3 className="mb-4 text-base font-bold">Прикрепленные документы</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <MockDocCard name="Уд. личности (Лицевая)" />
                            <MockDocCard name="Уд. личности (Обратная)" />
                            <MockDocCard name="Справка о наличии счета (IBAN)" />
                            <MockDocCard name="Справка ИИН" />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 border-t bg-muted/30 p-4 px-6 flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold"
                        onClick={onReject}
                    >
                        Отклонить
                    </Button>

                    <div className="flex gap-3">
                        {onRevision && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold gap-2"
                                onClick={onRevision}
                            >
                                <FileWarning className="h-4 w-4" />
                                На доработку
                            </Button>
                        )}
                        <Button
                            size="lg"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm"
                            onClick={onApprove}
                        >
                            <CheckCircle className="h-4 w-4" />
                            Проверено, на подписание
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, icon, className }: { label: string, value: string, icon: React.ReactNode, className?: string }) {
    return (
        <div className="flex flex-col gap-1.5 p-3 rounded-md bg-muted/30 border border-transparent">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                {icon}
                {label}
            </span>
            <span className={cn("text-sm font-medium text-foreground", className)}>{value}</span>
        </div>
    );
}

function MockDocCard({ name }: { name: string }) {
    return (
        <div className="flex items-center gap-3 rounded-md border bg-card p-3 shadow-sm hover:border-primary/40 cursor-pointer transition-colors group">
            <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
                <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">.jpg • 2.5 MB</p>
            </div>
        </div>
    );
}
