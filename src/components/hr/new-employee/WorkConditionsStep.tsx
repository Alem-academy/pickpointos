import React from 'react';
import { type PVZ } from "@/services/api";
import { type EmployeeFormData } from "@/hooks/useEmployeeForm";

interface WorkConditionsStepProps {
    formData: EmployeeFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    pvzList: PVZ[];
}

export function WorkConditionsStep({ formData, handleChange, pvzList }: WorkConditionsStepProps) {
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
                        <option value="employee">Менеджер ПВЗ</option>
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
                        <input
                            readOnly
                            type="text"
                            value="85 000"
                            className="w-full rounded-lg border bg-slate-100 text-slate-500 pl-10 pr-4 py-3 text-sm focus:outline-none cursor-not-allowed font-semibold"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
