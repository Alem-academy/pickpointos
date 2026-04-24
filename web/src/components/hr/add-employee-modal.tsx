"use client";

import { useState, useEffect } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { api, type PVZ, type EmployeeRole, type EmployeeStatus } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AddEmployeeModalProps {
    onSuccess: () => void;
}

export function AddEmployeeModal({ onSuccess }: AddEmployeeModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [formData, setFormData] = useState<{
        iin: string;
        fullName: string;
        phone: string;
        email: string;
        role: EmployeeRole;
        main_pvz_id: string;
        status: EmployeeStatus;
    }>({
        iin: '',
        fullName: '',
        phone: '',
        email: '',
        role: 'employee',
        main_pvz_id: '',
        status: 'new'
    });

    useEffect(() => {
        if (open) {
            loadPvz();
        }
    }, [open]);

    const loadPvz = async () => {
        try {
            const list = await api.getPvzList();
            setPvzList(list);
        } catch (err) {
            console.error('Failed to load PVZ:', err);
            toast.error("Failed to load PVZ list");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.iin.length !== 12) {
            toast.error('ИИН должен состоять из 12 цифр');
            return;
        }

        setIsLoading(true);
        try {
            await api.createEmployee({
                iin: formData.iin,
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                role: formData.role,
                mainPvzId: formData.main_pvz_id || null,
                status: formData.status
            });
            toast.success("Сотрудник успешно создан");
            onSuccess();
            setOpen(false);
            setFormData({
                iin: '',
                fullName: '',
                phone: '',
                email: '',
                role: 'employee',
                main_pvz_id: '',
                status: 'new'
            });
        } catch (err) {
            console.error('Failed to create employee:', err);
            toast.error('Ошибка при создании сотрудника');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Добавить сотрудника
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Новый сотрудник</DialogTitle>
                    <DialogDescription>
                        Заполните данные для регистрации нового сотрудника в системе.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="iin">ИИН (12 цифр)</Label>
                        <Input
                            id="iin"
                            required
                            maxLength={12}
                            value={formData.iin}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setFormData({ ...formData, iin: val });
                            }}
                            placeholder="000000000000"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">ФИО</Label>
                        <Input
                            id="fullName"
                            required
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Иванов Иван Иванович"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Телефон</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+7 (777) ..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="ivan@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Роль</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(val) => setFormData({ ...formData, role: val as EmployeeRole })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите роль" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="employee">Сотрудник ПВЗ</SelectItem>
                                <SelectItem value="rf">Региональный (RF)</SelectItem>
                                <SelectItem value="hr">HR Менеджер</SelectItem>
                                <SelectItem value="admin">Администратор</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pvz">Основной ПВЗ</Label>
                        <Select
                            value={formData.main_pvz_id}
                            onValueChange={(val) => setFormData({ ...formData, main_pvz_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите ПВЗ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Не выбрано</SelectItem>
                                {pvzList.map(pvz => (
                                    <SelectItem key={pvz.id} value={pvz.id}>
                                        {pvz.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Создать сотрудника
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
