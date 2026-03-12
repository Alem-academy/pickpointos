import { useState, useEffect } from "react";
import { type EmployeeRole } from "@/services/api";

export interface FileUploadState {
    id_main: File | null;
    id_register: File | null;
    cert_075: File | null;
    photo: File | null;
    bank_cert: File | null;
    cert_tb: File | null;
    address_cert: File | null;
}

export interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}

export interface FormErrors {
    firstName?: string;
    lastName?: string;
    iin?: string;
    phone?: string;
    address?: string;
}

export interface EmployeeFormData {
    firstName: string;
    lastName: string;
    phone: string;
    iin: string;
    pvzId: string;
    baseRate: string;
    role: EmployeeRole;
    email: string;
    address: string;
}

export function useEmployeeForm() {
    const [errors, setErrors] = useState<FormErrors>({});

    const [formData, setFormData] = useState<EmployeeFormData>({
        firstName: '',
        lastName: '',
        phone: '',
        iin: '',
        pvzId: '',
        baseRate: '',
        role: 'employee' as EmployeeRole,
        email: '',
        address: ''
    });

    const [files, setFiles] = useState<FileUploadState>({
        id_main: null,
        id_register: null,
        cert_075: null,
        photo: null,
        bank_cert: null,
        cert_tb: null,
        address_cert: null,
    });

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
        { name: '', phone: '', relationship: '' },
        { name: '', phone: '', relationship: '' }
    ]);

    // Загрузка черновика при монтировании
    useEffect(() => {
        const draft = localStorage.getItem('new-employee-draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                setFormData(parsed);
                console.log('✅ Черновик загружен');
            } catch (e) {
                console.error('Ошибка загрузки черновика:', e);
            }
        }
    }, []);

    // Автосохранение черновика при изменении данных
    useEffect(() => {
        if (formData.firstName || formData.lastName || formData.iin) {
            localStorage.setItem('new-employee-draft', JSON.stringify(formData));
        }
    }, [formData]);

    const validateField = (name: string, value: string): string | null => {
        switch (name) {
            case 'iin':
                if (!value) return 'ИИН обязателен';
                if (value.length !== 12) return 'ИИН должен содержать 12 цифр';
                if (!/^\d+$/.test(value)) return 'ИИН должен содержать только цифры';
                return null;
            case 'phone':
                if (!value) return 'Телефон обязателен';
                if (!value.startsWith('+')) return 'Телефон должен начинаться с +';
                return null;
            case 'firstName':
                if (!value) return 'Имя обязательно';
                return null;
            case 'lastName':
                if (!value) return 'Фамилия обязательна';
                return null;
            case 'address':
                if (!value) return 'Адрес обязателен';
                return null;
            default:
                return null;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Валидация в реальном времени
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error || undefined }));
    };

    const handleFileChange = (type: keyof FileUploadState, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const removeFile = (type: keyof FileUploadState) => {
        setFiles(prev => ({ ...prev, [type]: null }));
    };

    const validateStep = (stepIndex: number): boolean => {
        if (stepIndex === 0) {
            const newErrors: FormErrors = {};
            let isValid = true;

            if (!formData.firstName) {
                newErrors.firstName = 'Имя обязательно';
                isValid = false;
            }
            if (!formData.lastName) {
                newErrors.lastName = 'Фамилия обязательна';
                isValid = false;
            }
            if (!formData.iin) {
                newErrors.iin = 'ИИН обязателен';
                isValid = false;
            } else if (formData.iin.length !== 12) {
                newErrors.iin = 'ИИН должен содержать 12 цифр';
                isValid = false;
            }
            if (!formData.phone) {
                newErrors.phone = 'Телефон обязателен';
                isValid = false;
            }
            if (!formData.address) {
                newErrors.address = 'Адрес обязателен';
                isValid = false;
            }

            setErrors(newErrors);
            return isValid;
        }
        if (stepIndex === 1) {
            if (!formData.role) {
                setErrors({} as FormErrors);
                return false;
            }
            setErrors({} as FormErrors);
            return true;
        }
        return true;
    };

    const clearDraft = () => {
        localStorage.removeItem('new-employee-draft');
    };

    return {
        formData,
        setFormData,
        errors,
        files,
        emergencyContacts,
        setEmergencyContacts,
        handleChange,
        handleFileChange,
        removeFile,
        validateStep,
        clearDraft
    };
}
