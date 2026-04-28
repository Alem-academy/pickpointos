import React from 'react';
import { cn } from "@/lib/utils";
import { type EmergencyContact, type FormErrors, type EmployeeFormData } from "@/hooks/useEmployeeForm";
import { IINInput, PhoneInput, IBANInput, IdCardInput } from "@/components/ui/masked-input";

interface GeneralInfoStepProps {
    formData: EmployeeFormData;
    errors: FormErrors;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    emergencyContacts: EmergencyContact[];
    setEmergencyContacts: (contacts: EmergencyContact[]) => void;
}

export function GeneralInfoStep({ formData, errors, handleChange, emergencyContacts, setEmergencyContacts }: GeneralInfoStepProps) {
    return (
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
                        className={cn(
                            "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                            errors.firstName && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="Например: Айдар"
                    />
                    {errors.firstName && (
                        <p className="text-xs text-red-500">{errors.firstName}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Фамилия <span className="text-destructive">*</span></label>
                    <input
                        required
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={cn(
                            "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                            errors.lastName && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="Например: Нұрланов"
                    />
                    {errors.lastName && (
                        <p className="text-xs text-red-500">{errors.lastName}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">ИИН <span className="text-destructive">*</span></label>
                    <IINInput
                        name="iin"
                        value={formData.iin}
                        onChange={handleChange}
                        error={!!errors.iin}
                        placeholder="000 000 000 000"
                    />
                    {errors.iin && (
                        <p className="text-xs text-red-500">{errors.iin}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Телефон <span className="text-destructive">*</span></label>
                    <PhoneInput
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={!!errors.phone}
                        placeholder="+7 (___) ___-__-__"
                    />
                    {errors.phone && (
                        <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
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
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Отчество</label>
                    <input
                        name="patronymic"
                        value={formData.patronymic}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Например: Сергеевич"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">IBAN</label>
                    <IBANInput
                        name="iban"
                        value={formData.iban}
                        onChange={handleChange}
                        placeholder="KZ__ ____ ____ ____ ____"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold">Фактический адрес места жительства <span className="text-destructive">*</span></label>
                    <input
                        required
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        className={cn(
                            "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                            errors.address && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="г. Алматы, ул. Абая 1, кв 2"
                    />
                    {errors.address && (
                        <p className="text-xs text-red-500">{errors.address}</p>
                    )}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold">Адрес регистрации (прописка)</label>
                    <input
                        name="registeredAddress"
                        type="text"
                        value={formData.registeredAddress}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="г. Алматы, ул. Абая 1, кв 2"
                    />
                </div>
                
                {/* ID Card Section */}
                <div className="md:col-span-2 mt-4 p-4 rounded-lg border bg-muted/30">
                    <h4 className="text-sm font-semibold mb-3">📄 Удостоверение личности</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Номер удостоверения</label>
                            <IdCardInput
                                name="idCardNumber"
                                value={formData.idCardNumber || ''}
                                onChange={handleChange}
                                placeholder="123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Дата выдачи</label>
                            <input
                                name="idCardIssueDate"
                                type="date"
                                value={formData.idCardIssueDate || ''}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-medium">Кем выдано</label>
                            <input
                                name="idCardIssuedBy"
                                value={formData.idCardIssuedBy || ''}
                                onChange={handleChange}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Министерство юстиции РК"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Emergency Contacts Section */}
            <div className="mt-8 pt-6 border-t">
                <h4 className="text-base font-semibold mb-4">Контакты родственников</h4>
                <p className="text-sm text-muted-foreground mb-4">Укажите 1-2 человека для экстренной связи</p>

                {emergencyContacts.map((contact, index) => (
                    <div key={index} className="grid gap-4 md:grid-cols-3 mb-4 p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">ФИО</label>
                            <input
                                value={contact.name}
                                onChange={(e) => {
                                    const updated = [...emergencyContacts];
                                    updated[index].name = e.target.value;
                                    setEmergencyContacts(updated);
                                }}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Иванов Иван"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Телефон</label>
                            <input
                                value={contact.phone}
                                onChange={(e) => {
                                    const updated = [...emergencyContacts];
                                    updated[index].phone = e.target.value;
                                    setEmergencyContacts(updated);
                                }}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="+7..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Кем приходится</label>
                            <select
                                value={contact.relationship}
                                onChange={(e) => {
                                    const updated = [...emergencyContacts];
                                    updated[index].relationship = e.target.value;
                                    setEmergencyContacts(updated);
                                }}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Выберите...</option>
                                <option value="мать">Мать</option>
                                <option value="отец">Отец</option>
                                <option value="супруг(а)">Супруг(а)</option>
                                <option value="брат/сестра">Брат/Сестра</option>
                                <option value="друг/подруга">Друг/Подруга</option>
                                <option value="другое">Другое</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
