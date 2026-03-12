import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { api, type PVZ } from "@/services/api";
import { PageHeader } from "@/components/ui/page-header";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";

import { useEmployeeForm } from "@/hooks/useEmployeeForm";
import { GeneralInfoStep } from "@/components/hr/new-employee/GeneralInfoStep";
import { WorkConditionsStep } from "@/components/hr/new-employee/WorkConditionsStep";
import { DocumentsStep } from "@/components/hr/new-employee/DocumentsStep";

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

    const {
        formData,
        errors,
        files,
        emergencyContacts,
        setEmergencyContacts,
        handleChange,
        handleFileChange,
        removeFile,
        validateStep,
        clearDraft
    } = useEmployeeForm();

    useEffect(() => {
        api.getPvzList().then(setPvzList).catch(console.error);
    }, []);

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
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
            // Filter out empty contacts
            const validContacts = emergencyContacts.filter(c => c.name && c.phone && c.relationship);

            // 1. Create employee
            const newEmployee = await api.createEmployee({
                full_name: `${formData.lastName} ${formData.firstName}`,
                iin: formData.iin,
                phone: formData.phone,
                email: formData.email,
                role: formData.role,
                main_pvz_id: formData.pvzId || undefined,
                status: 'new',
                base_rate: 85000,
                address: formData.address || undefined,
                emergency_contacts: validContacts.length > 0 ? validContacts : undefined
            });

            // 2. Upload files
            setCreatedEmployeeId(newEmployee.id);
            const uploadPromises = [];

            if (files.id_main) uploadPromises.push(api.uploadDocument(newEmployee.id, 'id_main', files.id_main));
            if (files.id_register) uploadPromises.push(api.uploadDocument(newEmployee.id, 'id_register', files.id_register));
            if (files.cert_075) uploadPromises.push(api.uploadDocument(newEmployee.id, 'cert_075', files.cert_075));
            if (files.photo) uploadPromises.push(api.uploadDocument(newEmployee.id, 'photo', files.photo));
            if (files.bank_cert) uploadPromises.push(api.uploadDocument(newEmployee.id, 'bank_details', files.bank_cert));
            if (files.cert_tb) uploadPromises.push(api.uploadDocument(newEmployee.id, 'cert_tb', files.cert_tb));
            if (files.address_cert) uploadPromises.push(api.uploadDocument(newEmployee.id, 'address_cert', files.address_cert));

            await Promise.all(uploadPromises);

            clearDraft();
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
                            {currentStep === 0 && (
                                <GeneralInfoStep
                                    formData={formData}
                                    errors={errors}
                                    handleChange={handleChange}
                                    emergencyContacts={emergencyContacts}
                                    setEmergencyContacts={setEmergencyContacts}
                                />
                            )}
                            {currentStep === 1 && (
                                <WorkConditionsStep
                                    formData={formData}
                                    handleChange={handleChange}
                                    pvzList={pvzList}
                                />
                            )}
                            {currentStep === 2 && (
                                <DocumentsStep
                                    files={files}
                                    handleFileChange={handleFileChange}
                                    removeFile={removeFile}
                                />
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
