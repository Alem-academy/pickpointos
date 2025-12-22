import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, UserPlus, CheckCircle2, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";


interface FileUploadState {
    id_main: File | null;
    id_register: File | null;
    iin: File | null;
    bank_details: File | null;
}

export default function NewHire() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [files, setFiles] = useState<FileUploadState>({
        id_main: null,
        id_register: null,
        iin: null,
        bank_details: null,
    });

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

        // Validation
        const missingFiles = Object.entries(files).filter(([, file]) => !file);
        if (missingFiles.length > 0) {
            alert(`Пожалуйста, загрузите все обязательные документы: ${missingFiles.map(([key]) => key.replace('_', ' ')).join(', ')}`);
            return;
        }

        setIsLoading(true);
        // Simulate API call and File Upload
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
        setStep(2); // Success state
    };

    if (step === 2) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600 dark:bg-green-900/20">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold">Заявка отправлена!</h2>
                <p className="mt-2 text-muted-foreground">
                    HR отдел рассмотрит документы. Вы можете отслеживать статус в дашборде.
                </p>
                <button
                    onClick={() => navigate("/rf")}
                    className="mt-8 rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    Вернуться в Дашборд
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Новый Кандидат</h1>
                <p className="text-muted-foreground">Заполните форму для регистрации нового сотрудника.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border bg-card p-6 shadow-sm">
                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Личная Информация</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Имя</label>
                            <input
                                required
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Айдар"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Фамилия</label>
                            <input
                                required
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Нұрланов"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Номер телефона</label>
                            <input
                                required
                                type="tel"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="+7 (7XX) XXX-XX-XX"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Documents */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Документы</h3>
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
                            label="ИИН (Справка/Документ)"
                            file={files.iin}
                            onChange={(e) => handleFileChange('iin', e)}
                            onRemove={() => removeFile('iin')}
                        />
                        <FileUploadField
                            label="Реквизиты (IBAN)"
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
                            "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            "Отправка..."
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4" />
                                Отправить Заявку
                            </>
                        )}
                    </button>
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
            <label className="text-sm font-medium">{label} <span className="text-red-500">*</span></label>

            {!file ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-6 py-8 transition-colors hover:bg-muted hover:border-primary/50"
                >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                        <span className="font-semibold text-primary">Нажмите для загрузки</span>
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
                <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="rounded bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20">
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
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
