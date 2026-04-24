"use client";

import { useState } from 'react';
import { api } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

interface CandidateFormProps {
    onSuccess?: () => void;
}

export function CandidateForm({ onSuccess }: CandidateFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        iin: '',
        phone: '',
        role: 'employee',
        main_pvz_id: 'PVZ-001' // Default or from context
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.createEmployee({
                ...formData,
                status: 'new',
                // @ts-ignore
                role: formData.role
            });
            toast.success("Кандидат успешно добавлен");
            setFormData({
                full_name: '',
                iin: '',
                phone: '',
                role: 'employee',
                main_pvz_id: 'PVZ-001'
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            toast.error("Ошибка при добавлении кандидата");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="full_name">ФИО</Label>
                <Input
                    id="full_name"
                    required
                    placeholder="Иванов Иван Иванович"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="iin">ИИН</Label>
                    <Input
                        id="iin"
                        required
                        placeholder="12 цифр"
                        maxLength={12}
                        value={formData.iin}
                        onChange={(e) => setFormData({ ...formData, iin: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                        id="phone"
                        required
                        placeholder="+7 (7xx) xxx-xx-xx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Должность</Label>
                <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Выберите должность" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="employee">Сотрудник ПВЗ</SelectItem>
                        <SelectItem value="rf">Управляющий (РФ)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Отправить заявку
            </Button>
        </form>
    );
}
