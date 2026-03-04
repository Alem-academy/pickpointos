import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, UserPlus, CheckCircle2, X, FileText, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { api, type PVZ, type EmployeeRole } from "@/services/api";
import { PageHeader } from "@/components/ui/page-header";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";

interface FileUploadState {
    id_main: File | null;
    id_register: File | null;
    cert_075: File | null;
    photo: File | null;
    bank_details: File | null;
}

const STEPS = [
    { label: "Личные данные" },
    { label: "Условия работы" },
    { label: "Документы" }
];

export default function NewEmployeePage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null);
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [pvzList, setPvzList] = useState<PVZ[]>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        iin: '',
        iban: '',
        pvzId: '',
        baseRate: '',
        role: 'employee' as EmployeeRole,
        email: ''
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

    const validateStep = (stepIndex: number) => {
        if (stepIndex === 0) {
            return formData.firstName && formData.lastName && formData.iin.length === 12 && formData.phone;
        }
        if (stepIndex === 1) {
            return formData.role && formData.baseRate;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        } else {
            alert('Пожалуйста, заполните все обязательные поля корректно.');
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        const missingFiles = [];
        if (!files.id_main) missingFiles.push("Уд. личности (Лиц.)");
        if (!files.photo) missingFiles.push("Фото 3х4");

        if (missingFiles.length > 0) {
            alert(`Загрузите обязательные документы: ${missingFiles.join(', ')}`);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Create employee
            const newEmployee = await api.createEmployee({
                full_name: `${formData.lastName} ${formData.firstName}`,
                iin: formData.iin,
                phone: formData.phone,
                email: formData.email,
                role: formData.role,
                main_pvz_id: formData.pvzId || null,
                status: 'new',
                base_rate: Number(formData.baseRate),
                iban: formData.iban,
            });

            // 2. Upload files
            setCreatedEmployeeId(newEmployee.id);
            const uploadPromises = [];

            if (files.id_main) uploadPromises.push(api.uploadDocument(newEmployee.id, 'id_main', files.id_main));
            if (files.id_register) uploadPromises.push(api.uploadDocument(newEmployee.id, 'id_register', files.id_register));
            if (files.cert_075) uploadPromises.push(api.uploadDocument(newEmployee.id, 'cert_075', files.cert_075));
            if (files.photo) uploadPromises.push(api.uploadDocument(newEmployee.id, 'photo', files.photo));
            if (files.bank_details) uploadPromises.push(api.uploadDocument(newEmployee.id, 'bank_details', files.bank_details));

            await Promise.all(uploadPromises);

            setIsSubmitted(true);
        } catch (err) {
            console.error(err);
            alert('Ошибка при создании сотрудника: ' + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!createdEmployeeId) return;
        setIsGeneratingContract(true);
        try {
            await api.generateDocument(createdEmployeeId, 'contract');
            alert('Трудовой договор успешно сгенерирован!');
            navigate(`/hr/employees/${createdEmployeeId}`);
        } catch (err) {
            console.error(err);
            alert('Ошибка при генерации договора: ' + (err as Error).message);
        } finally {
            setIsGeneratingContract(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex h-full flex-col bg-background/50">
                <PageHeader
                    title="Новый Сотрудник"
                    description="Оформление заявки на прием сотрудника"
                    breadcrumbs={[{ label: "Сотрудники", path: "/hr/employees" }, { label: "Новый сотрудник" }]}
                />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full rounded-2xl border bg-card p-8 text-center shadow-lg">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Успешно!</h2>
                        <p className="text-muted-foreground mb-8">
                            Сотрудник и его документы добавлены в базу.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleGenerateContract} disabled={isGeneratingContract}>
                                {isGeneratingContract ? "Генерация..." : "Сгенерировать договор"}
                            </Button>
                            <Button variant="outline" className="w-full h-12 text-base font-semibold border-2" onClick={() => navigate(`/hr/employees/${createdEmployeeId}`)}>
                                Перейти в профиль
                            </Button>
                            <Button variant="ghost" className="w-full h-12 text-base font-semibold" onClick={() => window.location.reload()}>
                                Добавить еще одного
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background/50">
            <PageHeader
                title="Новый Сотрудник"
                description="Оформление заявки на прием сотрудника (HR)"
                breadcrumbs={[{ label: "Сотрудники", path: "/hr/employees" }, { label: "Новый сотрудник" }]}
            />

            <div className="flex-1 overflow-y-auto px-6 pb-20">
                <div className="mx-auto max-w-3xl">
                    <Stepper steps={STEPS} currentStep={currentStep} />

                    <div className="mt-8 rounded-2xl border bg-card shadow-sm overflow-hidden">
                        <div className="p-8">
                            {/* STEP 1: Personal Info */}
                            {currentStep === 0 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold">Личные данные</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Основная информация о сотруднике</p>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Имя <span className="text-destructive">*</span></label>
                                            <input
                                                required
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="Например: Айдар"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Фамилия <span className="text-destructive">*</span></label>
                                            <input
                                                required
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="Например: Нұрланов"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">ИИН <span className="text-destructive">*</span></label>
                                            <input
                                                required
                                                name="iin"
                                                maxLength={12}
                                                value={formData.iin}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="12 цифр"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Телефон <span className="text-destructive">*</span></label>
                                            <input
                                                required
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="+7..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Email</label>
                                            <input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="example@mail.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Job Info */}
                            {currentStep === 1 && (
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
                                                {pvzList.map(pvz => (
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
                                            <label className="text-sm font-semibold">Ставка (Оклад за смену) <span className="text-destructive">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-muted-foreground font-bold">₸</span>
                                                <input
                                                    required
                                                    name="baseRate"
                                                    type="number"
                                                    min="0"
                                                    value={formData.baseRate}
                                                    onChange={handleChange}
                                                    className="w-full rounded-lg border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    placeholder="Например: 5000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">IBAN Счет</label>
                                            <input
                                                name="iban"
                                                value={formData.iban}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border bg-background px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono tracking-wider"
                                                placeholder="KZ..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Documents */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold">Скан-копии документов</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Обязательные документы для оформления</p>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <FileUploadField
                                            label="Уд. личности (Лицевая)"
                                            file={files.id_main}
                                            onChange={(e) => handleFileChange('id_main', e)}
                                            onRemove={() => removeFile('id_main')}
                                            required
                                        />
                                        <FileUploadField
                                            label="Фото 3х4 (Для профиля)"
                                            file={files.photo}
                                            onChange={(e) => handleFileChange('photo', e)}
                                            onRemove={() => removeFile('photo')}
                                            required
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
                                            label="Реквизиты (Скриншот)"
                                            file={files.bank_details}
                                            onChange={(e) => handleFileChange('bank_details', e)}
                                            onRemove={() => removeFile('bank_details')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Footer */}
                        <div className="border-t bg-muted/30 p-6 flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 0 || isLoading}
                                className="w-[140px] border-2 font-semibold bg-background"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                            </Button>

                            {currentStep < STEPS.length - 1 ? (
                                <Button
                                    onClick={handleNext}
                                    className="w-[140px] font-bold shadow-md"
                                >
                                    Далее <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="w-[200px] font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isLoading ? (
                                        "Создание..."
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Создать
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FileUploadField({
    label,
    file,
    onChange,
    onRemove,
    required = false
}: {
    label: string;
    file: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    required?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>{label}</span>
                {required && <span className="text-destructive">*</span>}
            </label>

            {!file ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-6 transition-colors hover:bg-muted/50 hover:border-primary/50 group h-[120px]"
                >
                    <Upload className="mb-2 h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-xs font-semibold text-center mt-1 group-hover:text-primary transition-colors">
                        Нажмите для загрузки
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
                <div className="flex flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm h-[120px] relative group overflow-hidden">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-background p-2 text-primary shadow-sm">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 pr-6">
                            <p className="truncate text-sm font-bold text-foreground" title={file.name}>{file.name}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-2 right-2 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 bg-background shadow-sm hover:text-destructive transition-all"
                        title="Удалить файл"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full opacity-60"></div>
                </div>
            )}
        </div>
    );
}
