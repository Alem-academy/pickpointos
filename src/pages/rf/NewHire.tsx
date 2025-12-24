import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, UserPlus, CheckCircle2, X, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type PVZ } from "@/services/api";

interface FileUploadState {
    id_main: File | null;
    id_register: File | null;
    cert_075: File | null;
    photo: File | null;
    bank_details: File | null;
}

export default function NewHire() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        iin: '',
        iban: '',
        pvzId: '',
        baseRate: '',
        role: 'employee' as 'employee' | 'rf'
    });

    const [files, setFiles] = useState<FileUploadState>({
        id_main: null,
        id_register: null,
        cert_075: null,
        photo: null,
        bank_details: null,
    });

    useEffect(() => {
        api.getPvzList().then(setPvzList).catch(console.error);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (type: keyof FileUploadState, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const removeFile = (type: keyof FileUploadState) => {
        setFiles(prev => ({ ...prev, [type]: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate IIN (12 digits)
        if (!/^\d{12}$/.test(formData.iin)) {
            alert('ИИН должен состоять из 12 цифр');
            return;
        }

        // 2. Validate IBAN (Basic Alphanumeric check)
        if (!/^[A-Z0-9]{16,34}$/.test(formData.iban.toUpperCase().replace(/\s/g, ''))) {
            alert('Некорректный формат IBAN. Должен содержать буквы и цифры.');
            return;
        }

        // 3. Required Files Check
        const missingFiles = [];
        if (!files.id_main) missingFiles.push("Уд. личности (Лиц.)");
        if (!files.photo) missingFiles.push("Фото 3х4"); // Photo is mandatory often

        if (missingFiles.length > 0) {
            alert(`Загрузите обязательные документы: ${missingFiles.join(', ')}`);
            return;
        }

        setIsLoading(true);

        try {
            await api.createEmployee({
                full_name: `${formData.lastName} ${formData.firstName}`,
                iin: formData.iin,
                phone: formData.phone,
                email: null, // Optional for now
                role: formData.role,
                main_pvz_id: formData.pvzId,
                status: 'new', // HR Request status
                base_rate: Number(formData.baseRate),
                iban: formData.iban,
            });

            // If success
            setStep(2);
        } catch (err) {
            console.error(err);
            alert('Ошибка при создании заявки: ' + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600 dark:bg-green-900/20">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold">Заявка отправлена!</h2>
                <p className="mt-2 text-muted-foreground">
                    HR отдел рассмотрит заявку и документы. Вы можете отслеживать статус.
                </p>
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg border px-6 py-2 hover:bg-slate-50"
                    >
                        Создать еще
                    </button>
                    <button
                        onClick={() => navigate("/rf")}
                        className="rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        Вернуться в Дашборд
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl p-8 pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Новый Кандидат</h1>
                <p className="text-muted-foreground">Заполнение анкеты на прием сотрудника.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border bg-card p-6 shadow-sm">
                {/* Personal Info */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">1</div>
                        Личные данные
                    </h3>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Имя <span className="text-red-500">*</span></label>
                            <input
                                required
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black"
                                placeholder="Например: Айдар"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Фамилия <span className="text-red-500">*</span></label>
                            <input
                                required
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black"
                                placeholder="Например: Нұрланов"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ИИН (12 цифр) <span className="text-red-500">*</span></label>
                            <input
                                required
                                name="iin"
                                maxLength={12}
                                value={formData.iin}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black"
                                placeholder="000000000000"
                            />
                            <p className="text-xs text-muted-foreground">Только цифры</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Телефон <span className="text-red-500">*</span></label>
                            <input
                                required
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black"
                                placeholder="+7..."
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Job Info */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">2</div>
                        Условия работы
                    </h3>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Пункт выдачи (ПВЗ) <span className="text-red-500">*</span></label>
                            <select
                                required
                                name="pvzId"
                                value={formData.pvzId}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black"
                            >
                                <option value="">Выберите ПВЗ...</option>
                                {pvzList.map(pvz => (
                                    <option key={pvz.id} value={pvz.id}>{pvz.name} ({pvz.address})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Должность</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black"
                            >
                                <option value="employee">Менеджер ПВЗ</option>
                                <option value="rf">Региональный Менеджер (РФ)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ставка (Оклад за смену) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-muted-foreground">₸</span>
                                <input
                                    required
                                    name="baseRate"
                                    type="number"
                                    min="0"
                                    value={formData.baseRate}
                                    onChange={handleChange}
                                    className="w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-black"
                                    placeholder="5000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">IBAN Счет <span className="text-red-500">*</span></label>
                            <input
                                required
                                name="iban"
                                value={formData.iban}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-black"
                                placeholder="KZ..."
                            />
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>Проверьте правильность счета дважды</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Documents */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">3</div>
                        Скан-копии документов
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <FileUploadField
                            label="Уд. личности (Лицевая)"
                            file={files.id_main}
                            onChange={(e) => handleFileChange('id_main', e)}
                            onRemove={() => removeFile('id_main')}
                        />
                        <FileUploadField
                            label="Уд. личности (Обратная)"
                            file={files.id_register}
                            onChange={(e) => handleFileChange('id_register', e)}
                            onRemove={() => removeFile('id_register')}
                        />
                        <FileUploadField
                            label="Мед. справка 075/у"
                            file={files.cert_075}
                            onChange={(e) => handleFileChange('cert_075', e)}
                            onRemove={() => removeFile('cert_075')}
                        />
                        <FileUploadField
                            label="Фото 3х4 (для дела)"
                            file={files.photo}
                            onChange={(e) => handleFileChange('photo', e)}
                            onRemove={() => removeFile('photo')}
                        />
                        <FileUploadField
                            label="Реквизиты (Скриншот)"
                            file={files.bank_details}
                            onChange={(e) => handleFileChange('bank_details', e)}
                            onRemove={() => removeFile('bank_details')}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-4 font-bold text-white transition-all hover:bg-gray-800 shadow-lg",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            "Отправка..."
                        ) : (
                            <>
                                <UserPlus className="h-5 w-5" />
                                Отправить Заявку HR
                            </>
                        )}
                    </button>
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Нажимая кнопку, вы подтверждаете корректность введенных данных.
                    </p>
                </div>
            </form>
        </div>
    );
}

function FileUploadField({
    label,
    file,
    onChange,
    onRemove
}: {
    label: string;
    file: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>

            {!file ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition-colors hover:bg-slate-100 hover:border-blue-400 group"
                >
                    <Upload className="mb-2 h-8 w-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <p className="text-sm text-muted-foreground text-center">
                        <span className="font-semibold text-blue-600">Загрузить</span>
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={onChange}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="rounded bg-blue-50 p-2 text-blue-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="truncate">
                            <p className="truncate text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
