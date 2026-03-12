import { useState } from "react";
import { api, type Employee } from "@/services/api";
import { cn } from "@/lib/utils";

const CHECKLIST_ITEMS = [
    { id: 'docs_uploaded', label: 'Документы загружены (УДЛ, Справки)' },
    { id: 'contract_signed', label: 'Трудовой договор подписан' },
    { id: 'telegram_added', label: 'Добавлен в рабочий чат Telegram' },
    { id: 'safety_briefing', label: 'Проведен инструктаж по ТБ' },
    { id: 'uniform_issued', label: 'Выдана форма (жилетка, бейдж)' },
    { id: 'crm_access', label: 'Доступ в CRM выдан' }
];

export function OnboardingTab({ employee, onUpdate }: { employee: Employee, onUpdate: () => void }) {
    const checklist = employee.onboarding_checklist || {};
    const [isUpdating, setIsUpdating] = useState(false);

    // Contract Signing State
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);

    const toggleItem = async (itemId: string) => {
        const newValue = !checklist[itemId];
        const newChecklist = { ...checklist, [itemId]: newValue };

        try {
            await api.updateEmployee(employee.id, {
                status: employee.status, // Required by backend
                onboarding_checklist: newChecklist
            } as any);
            onUpdate();
        } catch (err) {
            console.error(err);
            alert('Ошибка обновления чек-листа');
        }
    };

    const handleActivate = async () => {
        if (!confirm('Активировать сотрудника? Это даст ему доступ к системе.')) return;
        setIsUpdating(true);
        try {
            await api.updateEmployeeStatus(employee.id, 'active');
            onUpdate();
        } catch (err) {
            console.error(err);
            alert('Ошибка активации');
        } finally {
            setIsUpdating(false);
        }
    };

    const [inviteLink, setInviteLink] = useState<string | null>(null);

    const handleGenerateInvite = async () => {
        setIsGeneratingContract(true);
        try {
            const res = await api.generateInviteLink(employee.id);
            setInviteLink(res.url);
        } catch (err) {
            console.error(err);
            alert('Ошибка при генерации ссылки-приглашения');
        } finally {
            setIsGeneratingContract(false);
        }
    };

    const progress = CHECKLIST_ITEMS.filter(i => checklist[i.id]).length;
    const total = CHECKLIST_ITEMS.length;
    const isComplete = progress === total;

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg">Чек-лист пребординга</h3>
                            <p className="text-sm text-muted-foreground">Выполните все пункты перед активацией</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">{progress}/{total}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {CHECKLIST_ITEMS.map(item => (
                            <label key={item.id} className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!checklist[item.id]}
                                    onChange={() => toggleItem(item.id)}
                                    className="h-6 w-6 rounded-md border-slate-300 text-black focus:ring-black"
                                />
                                <div className="flex-1">
                                    <span className={cn("font-medium", checklist[item.id] ? "text-slate-900" : "text-slate-500")}>
                                        {item.label}
                                    </span>
                                </div>
                                {item.id === 'contract_signed' && !checklist['contract_signed'] && (
                                    <div className="flex flex-col items-end gap-2 w-full max-w-sm mt-2 sm:mt-0">
                                        {!inviteLink ? (
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleGenerateInvite(); }}
                                                disabled={isGeneratingContract}
                                                className="rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                {isGeneratingContract ? 'Генерация...' : 'Сгенерировать ссылку'}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs w-full justify-between">
                                                <span className="truncate text-blue-700 font-mono mr-2">{inviteLink}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigator.clipboard.writeText(inviteLink).then(() => alert('Ссылка скопирована!'));
                                                    }}
                                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded font-medium shadow-sm"
                                                >
                                                    Копировать
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-2xl border bg-slate-50 p-6">
                    <h3 className="mb-4 font-bold text-lg">Действия</h3>

                    {employee.status === 'active' ? (
                        <div className="rounded-xl bg-green-100 p-4 text-green-800 font-bold text-center">
                            Сотрудник активен
                        </div>
                    ) : (
                        <button
                            onClick={handleActivate}
                            disabled={!isComplete || isUpdating}
                            className="w-full rounded-xl bg-black py-4 font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
                        >
                            {isUpdating ? 'Активация...' : 'АКТИВИРОВАТЬ СОТРУДНИКА'}
                        </button>
                    )}

                    {!isComplete && employee.status !== 'active' && (
                        <p className="mt-3 text-xs text-center text-muted-foreground">
                            Заполните чек-лист полностью для активации
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
