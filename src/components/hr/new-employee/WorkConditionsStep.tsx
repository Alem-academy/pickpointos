import React from 'react';
import { cn } from "@/lib/utils";
import { type PVZ } from "@/services/api";
import { type EmployeeFormData, type FormErrors } from "@/hooks/useEmployeeForm";
import { NumberInput } from "@/components/ui/masked-input";

interface WorkConditionsStepProps {
    formData: EmployeeFormData;
    errors: FormErrors;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    pvzList: PVZ[];
}

export function WorkConditionsStep({ formData, errors, handleChange, pvzList }: WorkConditionsStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-6">
                <h3 className="text-xl font-bold">Условия работы</h3>
                <p className="text-sm text-muted-foreground mt-1">Организационные детали приема</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Пункт выдачи (ПВЗ)</label>
                    <select
                        name="pvzId"
                        value={formData.pvzId}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="" disabled>Выберите ПВЗ (если применимо)</option>
                        {pvzList.map((pvz: PVZ) => (
                            <option key={pvz.id} value={pvz.id}>{pvz.name} ({pvz.address})</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Должность <span className="text-destructive">*</span></label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="employee">Менеджер по работе с клиентами</option>
                        <option value="rf">Региональный Менеджер (РФ)</option>
                        <option value="hr">HR</option>
                        <option value="admin">Администратор</option>
                        <option value="financier">Финансист</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Оклад (МЗП) <span className="text-destructive">*</span></label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-muted-foreground font-bold">₸</span>
                        <NumberInput
                            name="baseRate"
                            value={formData.baseRate}
                            onChange={handleChange}
                            prefix=""
                            className={cn("pl-10", errors.baseRate && "border-red-500 focus:ring-red-500")}
                            placeholder="85 000"
                        />
                    </div>
                    {errors.baseRate && (
                        <p className="text-xs text-red-500">{errors.baseRate}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Дата окончания договора</label>
                    <input
                        name="contractEndDate"
                        type="date"
                        value={formData.contractEndDate || ''}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground">Если не указано — +1 год от даты приема</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Испытательный срок (месяцев)</label>
                    <select
                        name="probationMonths"
                        value={formData.probationMonths || '3'}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="1">1 месяц</option>
                        <option value="2">2 месяца</option>
                        <option value="3">3 месяца</option>
                        <option value="6">6 месяцев</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
