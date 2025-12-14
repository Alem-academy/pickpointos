import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api, type PVZ, type EmployeeRole, type EmployeeStatus } from '@/services/api';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.iin.length !== 12) {
            alert('ИИН должен состоять из 12 цифр');
            return;
        }

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
            alert('Ошибка при создании сотрудника');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Новый сотрудник</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">ИИН (12 цифр)</label>
                        <input
                            required
                            maxLength={12}
                            value={formData.iin}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setFormData(prev => ({ ...prev, iin: val }));
                            }}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                            placeholder="000000000000"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">ФИО</label>
                        <input
                            required
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                            placeholder="Иванов Иван Иванович"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Телефон</label>
                            <input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                placeholder="+7 (777) ..."
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                placeholder="ivan@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Роль</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                        >
                            <option value="employee">Сотрудник ПВЗ</option>
                            <option value="rf">Региональный (RF)</option>
                            <option value="hr">HR Менеджер</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Адрес проживания</label>
                        <input
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                            placeholder="г. Алматы, ул. Абая 10, кв. 5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Основной ПВЗ</label>
                            <select
                                value={formData.main_pvz_id}
                                onChange={e => setFormData({ ...formData, main_pvz_id: e.target.value })}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Не выбрано</option>
                                {pvzList.map(pvz => (
                                    <option key={pvz.id} value={pvz.id}>
                                        {pvz.name} ({pvz.address})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Ставка (KZT)</label>
                            <input
                                type="number"
                                value={formData.base_rate}
                                onChange={e => setFormData({ ...formData, base_rate: Number(e.target.value) })}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                                placeholder="5000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Дата найма</label>
                            <input
                                type="date"
                                value={formData.hired_at}
                                onChange={e => {
                                    const date = e.target.value;
                                    // Auto-calc probation (3 months)
                                    const d = new Date(date);
                                    d.setMonth(d.getMonth() + 3);
                                    setFormData({
                                        ...formData,
                                        hired_at: date,
                                        probation_until: d.toISOString().split('T')[0]
                                    });
                                }}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Испытательный срок до</label>
                            <input
                                type="date"
                                value={formData.probation_until}
                                onChange={e => setFormData({ ...formData, probation_until: e.target.value })}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Создать сотрудника
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

