import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { api, type EmployeeRole } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewEmployeePage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        iin: '',
        phone: '',
        email: '',
        role: 'employee' as EmployeeRole,
        base_rate: '5000',
        main_pvz_id: ''
    });

    const [pvzList, setPvzList] = useState<any[]>([]);

    useState(() => {
        api.getPvzList().then(setPvzList).catch(console.error);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                base_rate: Number(formData.base_rate)
            };
            await api.createEmployee(payload);
            toast.success("Сотрудник успешно создан");
            navigate('/hr/employees');
        } catch (err) {
            console.error(err);
            toast.error("Ошибка при создании сотрудника");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <button
                onClick={() => navigate('/hr/employees')}
                className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black"
            >
                <ArrowLeft className="h-4 w-4" />
                Назад к списку
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-black mb-2">Новый Сотрудник</h1>
                <p className="text-slate-500 font-bold">Ручное добавление сотрудника в базу</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-xl">
                <div className="space-y-2">
                    <label className="text-sm font-black uppercase text-slate-500">ФИО</label>
                    <input
                        required
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-bold focus:border-black focus:outline-none"
                        placeholder="Иванов Иван Иванович"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase text-slate-500">ИИН</label>
                        <input
                            required
                            value={formData.iin}
                            onChange={e => setFormData({ ...formData, iin: e.target.value })}
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-bold focus:border-black focus:outline-none"
                            placeholder="000000000000"
                            maxLength={12}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase text-slate-500">Телефон</label>
                        <input
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-bold focus:border-black focus:outline-none"
                            placeholder="+7 (700) 000-00-00"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black uppercase text-slate-500">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-bold focus:border-black focus:outline-none"
                        placeholder="employee@pvz.kz"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase text-slate-500">Роль</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-bold focus:border-black focus:outline-none"
                        >
                            <option value="employee">Сотрудник</option>
                            <option value="rf">Управляющий (РФ)</option>
                            <option value="hr">HR</option>
                            <option value="admin">Админ</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase text-slate-500">Основной ПВЗ</label>
                        <select
                            value={formData.main_pvz_id}
                            onChange={e => setFormData({ ...formData, main_pvz_id: e.target.value })}
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-bold focus:border-black focus:outline-none"
                        >
                            <option value="">Не назначен</option>
                            {pvzList.map(pvz => (
                                <option key={pvz.id} value={pvz.id}>{pvz.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black uppercase text-slate-500">Ставка (₸/смена)</label>
                    <input
                        type="number"
                        value={formData.base_rate}
                        onChange={e => setFormData({ ...formData, base_rate: e.target.value })}
                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 font-bold focus:border-black focus:outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                        "mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 font-black text-white hover:bg-slate-800",
                        isLoading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isLoading ? "Сохранение..." : (
                        <>
                            <Save className="h-5 w-5" />
                            СОХРАНИТЬ
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
