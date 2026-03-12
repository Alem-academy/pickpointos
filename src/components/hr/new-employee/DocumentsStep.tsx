import React, { useRef } from 'react';
import { Upload, FileText, X } from "lucide-react";
import { type FileUploadState } from "@/hooks/useEmployeeForm";

interface DocumentsStepProps {
    files: FileUploadState;
    handleFileChange: (type: keyof FileUploadState, e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: (type: keyof FileUploadState) => void;
}

export function DocumentsStep({ files, handleFileChange, removeFile }: DocumentsStepProps) {
    return (
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
                    label="Справка с банка (IBAN)"
                    file={files.bank_cert}
                    onChange={(e) => handleFileChange('bank_cert', e)}
                    onRemove={() => removeFile('bank_cert')}
                />
                <FileUploadField
                    label="Справка Тубдиспансер"
                    file={files.cert_tb}
                    onChange={(e) => handleFileChange('cert_tb', e)}
                    onRemove={() => removeFile('cert_tb')}
                />
                <FileUploadField
                    label="Справка eGov (Адресная)"
                    file={files.address_cert}
                    onChange={(e) => handleFileChange('address_cert', e)}
                    onRemove={() => removeFile('address_cert')}
                />
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
