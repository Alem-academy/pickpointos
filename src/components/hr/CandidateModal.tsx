import { X, FileText, User, CreditCard, Building, Calendar, Phone, CheckCircle } from "lucide-react";
import type { Employee } from "@/services/api";
import { cn } from "@/lib/utils";

interface CandidateModalProps {
    candidate: Employee;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
}

export function CandidateModal({ candidate, onClose, onApprove, onReject }: CandidateModalProps) {
    if (!candidate) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-8 py-6 backdrop-blur">
                    <div>
                        <h2 className="text-2xl font-bold">{candidate.full_name}</h2>
                        <span className="text-slate-500">Заявка на должность: {candidate.role === 'rf' ? 'Региональный менеджер' : 'Менеджер ПВЗ'}</span>
                    </div>
                    <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8">
                    {/* Key Info Cards */}
                    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-slate-500">
                                <Building className="h-4 w-4" />
                                <span className="text-sm font-bold uppercase">ПВЗ</span>
                            </div>
                            <p className="font-bold">{candidate.main_pvz_name || 'Не назначен'}</p>
                            <p className="text-xs text-slate-500">{candidate.main_pvz_address}</p>
                        </div>
                        <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-slate-500">
                                <CreditCard className="h-4 w-4" />
                                <span className="text-sm font-bold uppercase">Оклад (Ставка)</span>
                            </div>
                            <p className="font-bold text-lg">{candidate.base_rate?.toLocaleString()} ₸</p>
                        </div>
                        <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-slate-500">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm font-bold uppercase">Дата создания</span>
                            </div>
                            <p className="font-bold">{new Date(candidate.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                    </div>

                    {/* Personal & Bank Details */}
                    <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold">Личные данные</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <InfoRow label="ИИН" value={candidate.iin} icon={<User className="h-4 w-4" />} />
                            <InfoRow label="Телефон" value={candidate.phone || '—'} icon={<Phone className="h-4 w-4" />} />
                            <div className="md:col-span-2">
                                <InfoRow
                                    label="IBAN Счет"
                                    value={candidate.iban || 'Не указан'}
                                    icon={<CreditCard className="h-4 w-4" />}
                                    className="font-mono text-base tracking-wide bg-slate-50 p-2 rounded-lg border"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Documents (Mock) */}
                    <div className="mb-8">
                        <h3 className="mb-4 text-lg font-bold">Прикрепленные документы</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <MockDocCard name="Уд. личности (Лицевая)" />
                            <MockDocCard name="Уд. личности (Обратная)" />
                            <MockDocCard name="Справка о наличии счета (IBAN)" />
                            <MockDocCard name="Справка ИИН" />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 border-t bg-white p-6">
                    <div className="flex gap-4">
                        <button
                            onClick={onReject}
                            className="flex-1 rounded-xl border-2 border-red-100 bg-red-50 py-4 font-bold text-red-600 hover:bg-red-100"
                        >
                            Отклонить
                        </button>
                        <button
                            onClick={onApprove}
                            className="flex-[2] rounded-xl bg-black py-4 font-bold text-white shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="h-5 w-5" />
                            Одобрить и назначить собеседование
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, icon, className }: { label: string, value: string, icon: React.ReactNode, className?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                {icon}
                {label}
            </span>
            <span className={cn("font-medium text-slate-900", className)}>{value}</span>
        </div>
    );
}

function MockDocCard({ name }: { name: string }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 hover:bg-slate-100 cursor-pointer transition-colors">
            <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-slate-500">.jpg • 2.5 MB</p>
            </div>
        </div>
    );
}
