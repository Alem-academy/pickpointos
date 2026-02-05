import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api, type PVZ, type EmployeeRole, type EmployeeStatus } from '@/services/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormErrors {
    iin?: string;
    email?: string;
    phone?: string;
    base_rate?: string;
    general?: string;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});

    const [formData, setFormData] = useState<{
        iin: string;
        fullName: string;
        phone: string;
        email: string;
        role: EmployeeRole;
        main_pvz_id: string;
        status: EmployeeStatus;
        address: string;
        base_rate: number;
        hired_at: string;
        probation_until: string;
    }>({
        iin: '',
        fullName: '',
        phone: '',
        email: '',
        role: 'employee',
        main_pvz_id: '',
        status: 'new',
        address: '',
        base_rate: 0,
        hired_at: new Date().toISOString().split('T')[0],
        probation_until: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadPvz();
            // Reset form on open
            setErrors({});
            // Keep default values
        }
    }, [isOpen]);

    const loadPvz = async () => {
        try {
            const list = await api.getPvzList();
            setPvzList(list);
        } catch (err) {
            console.error('Failed to load PVZ:', err);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        if (!/^\d{12}$/.test(formData.iin)) {
            newErrors.iin = 'ИИН должен состоять из 12 цифр';
            isValid = false;
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный Email';
            isValid = false;
        }

        if (!formData.phone) {
            newErrors.phone = 'Введите номер телефона';
            isValid = false;
        }

        if (formData.base_rate < 0) {
            newErrors.base_rate = 'Ставка не может быть отрицательной';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await api.createEmployee({
                iin: formData.iin,
                full_name: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                role: formData.role,
                main_pvz_id: formData.main_pvz_id || null,
                status: formData.status,
                address: formData.address,
                base_rate: formData.base_rate,
                hired_at: formData.hired_at,
                probation_until: formData.probation_until
            });
            onSuccess();
            onClose();
            // Reset logic could be here or on open
            setFormData({
                iin: '',
                fullName: '',
                phone: '',
                email: '',
                role: 'employee',
                main_pvz_id: '',
                status: 'new',
                address: '',
                base_rate: 0,
                hired_at: new Date().toISOString().split('T')[0],
                probation_until: ''
            });
        } catch (err) {
            console.error('Failed to create employee:', err);
            setErrors({ general: 'Ошибка при создании сотрудника. Проверьте данные или попробуйте позже.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Новый сотрудник</h2>
                        <p className="text-sm text-slate-500">Заполните данные для регистрации</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                            {errors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">ИИН *</label>
                            <Input
                                required
                                maxLength={12}
                                value={formData.iin}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData(prev => ({ ...prev, iin: val }));
                                }}
                                placeholder="000000000000"
                                className={errors.iin ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.iin && <p className="text-xs text-red-500">{errors.iin}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">ФИО *</label>
                            <Input
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Иванов Иван Иванович"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Телефон *</label>
                            <Input
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+7 (777) ..."
                                className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Email *</label>
                            <Input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="ivan@example.com"
                                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Адрес проживания *</label>
                        <Input
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="г. Алматы, ул. Абая 10, кв. 5"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Роль</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                            >
                                <option value="employee">Сотрудник ПВЗ</option>
                                <option value="rf">Региональный (RF)</option>
                                <option value="hr">HR Менеджер</option>
                                <option value="admin">Администратор</option>
                                <option value="financier">Финансист</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Основной ПВЗ</label>
                            <select
                                value={formData.main_pvz_id}
                                onChange={e => setFormData({ ...formData, main_pvz_id: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                            >
                                <option value="">Не выбрано</option>
                                {pvzList.map(pvz => (
                                    <option key={pvz.id} value={pvz.id}>
                                        {pvz.name} ({pvz.address})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Ставка (KZT) *</label>
                        <Input
                            type="number"
                            required
                            min="0"
                            value={formData.base_rate}
                            onChange={e => setFormData({ ...formData, base_rate: Number(e.target.value) })}
                            placeholder="5000"
                            className={errors.base_rate ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.base_rate && <p className="text-xs text-red-500">{errors.base_rate}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Дата найма</label>
                            <Input
                                type="date"
                                required
                                value={formData.hired_at}
                                onChange={e => {
                                    const date = e.target.value;
                                    const d = new Date(date);
                                    d.setMonth(d.getMonth() + 3);
                                    setFormData({
                                        ...formData,
                                        hired_at: date,
                                        probation_until: d.toISOString().split('T')[0]
                                    });
                                }}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Испытательный срок до</label>
                            <Input
                                type="date"
                                required
                                value={formData.probation_until}
                                onChange={e => setFormData({ ...formData, probation_until: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Создать сотрудника
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

