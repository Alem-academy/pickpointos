import { useState } from 'react';
import { api, type PVZ } from '@/services/api';
import { CheckCircle, Circle, ArrowRight, Building, MapPin, Ruler, Briefcase } from 'lucide-react';

export default function NewPvz() {
    const [step, setStep] = useState<'details' | 'checklist'>('details');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        brand: 'wb',
        area: ''
    });
    const [createdPvz, setCreatedPvz] = useState<PVZ | null>(null);
    const [checklist, setChecklist] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const pvz = await api.createPvz({
                ...formData,
                area: Number(formData.area)
            });
            setCreatedPvz(pvz);

            // Fetch initial checklist
            const list = await api.getPvzChecklist(pvz.id);
            setChecklist(list);

            setStep('checklist');
        } catch (err) {
            console.error(err);
            alert('Ошибка создания ПВЗ');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = async (itemId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'pending' : 'done';
        try {
            // Optimistic update
            setChecklist(prev => prev.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
            ));

            if (createdPvz) {
                await api.updateChecklistItem(createdPvz.id, itemId, newStatus);
            }
        } catch (err) {
            console.error(err);
            // Revert on error
            setChecklist(prev => prev.map(item =>
                item.id === itemId ? { ...item, status: currentStatus } : item
            ));
        }
    };

    const progress = checklist.length > 0
        ? Math.round((checklist.filter(i => i.status === 'done').length / checklist.length) * 100)
        : 0;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="mb-2 text-4xl font-black">Открытие нового ПВЗ</h1>
                <p className="text-xl text-muted-foreground">Чек-лист запуска новой точки</p>
            </div>

            {step === 'details' && (
                <div className="mx-auto max-w-2xl rounded-3xl border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="mb-6 text-2xl font-black uppercase">Шаг 1: Детали точки</h2>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div>
                            <label className="mb-2 block font-bold flex items-center gap-2">
                                <Building className="h-5 w-5" /> Название
                            </label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Например: ПВЗ Абая 150"
                                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:border-black"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block font-bold flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Адрес
                            </label>
                            <input
                                required
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="г. Алматы, пр. Абая 150"
                                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:border-black"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block font-bold flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" /> Бренд
                                </label>
                                <select
                                    value={formData.brand}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:border-black"
                                >
                                    <option value="wb">Wildberries</option>
                                    <option value="ozon">Ozon</option>
                                    <option value="yandex">Yandex</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block font-bold flex items-center gap-2">
                                    <Ruler className="h-5 w-5" /> Площадь (м²)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.area}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    placeholder="50"
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-xl font-black text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isLoading ? 'СОЗДАНИЕ...' : 'НАЧАТЬ ПРОЦЕСС'}
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </form>
                </div>
            )}

            {step === 'checklist' && createdPvz && (
                <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white p-8 shadow-sm border-2 border-slate-100">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-2xl font-black uppercase">Чек-лист запуска</h2>
                                <span className="rounded-full bg-black px-4 py-1 text-sm font-bold text-white">
                                    {progress}% ГОТОВО
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-8 h-4 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="space-y-4">
                                {['renovation', 'equipment', 'staffing', 'legal'].map(category => {
                                    const items = checklist.filter(i => i.category === category);
                                    if (items.length === 0) return null;

                                    return (
                                        <div key={category} className="rounded-2xl border-2 border-slate-100 p-6">
                                            <h3 className="mb-4 text-lg font-black uppercase text-slate-400">
                                                {category === 'renovation' && '🚧 Ремонт'}
                                                {category === 'equipment' && '💻 Оборудование'}
                                                {category === 'staffing' && '👥 Персонал'}
                                                {category === 'legal' && '⚖️ Юридические'}
                                            </h3>
                                            <div className="space-y-3">
                                                {items.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => toggleItem(item.id, item.status)}
                                                        className={`flex w-full items-center gap-4 rounded-xl p-4 text-left font-bold transition-all ${item.status === 'done'
                                                            ? 'bg-green-50 text-green-700 line-through decoration-2'
                                                            : 'bg-slate-50 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {item.status === 'done' ? (
                                                            <CheckCircle className="h-6 w-6 shrink-0" />
                                                        ) : (
                                                            <Circle className="h-6 w-6 shrink-0 text-slate-300" />
                                                        )}
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="sticky top-8 rounded-3xl border-2 border-black bg-yellow-400 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="mb-2 text-xl font-black uppercase">Информация</h3>
                            <div className="space-y-4 text-sm font-bold">
                                <div>
                                    <div className="text-yellow-800">Название</div>
                                    <div className="text-lg">{createdPvz.name}</div>
                                </div>
                                <div>
                                    <div className="text-yellow-800">Адрес</div>
                                    <div className="text-lg">{createdPvz.address}</div>
                                </div>
                                <div>
                                    <div className="text-yellow-800">Бренд</div>
                                    <div className="text-lg uppercase">{createdPvz.brand}</div>
                                </div>
                                <div>
                                    <div className="text-yellow-800">Площадь</div>
                                    <div className="text-lg">{createdPvz.area_sqm} м²</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
