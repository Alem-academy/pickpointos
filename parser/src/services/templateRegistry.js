import {
    CONTRACT_TEMPLATE,
    ADDENDUM_TEMPLATE,
    HIRING_ORDER_TEMPLATE,
    EMPLOYMENT_APPLICATION_TEMPLATE,
    VACATION_APPLICATION_TEMPLATE,
    VACATION_ORDER_TEMPLATE,
    TERMINATION_ORDER_TEMPLATE,
    EMPLOYMENT_CERTIFICATE_TEMPLATE,
} from './templates.js';
import {
    getTemplate as getFileTemplate,
    getSchema as getFileSchema,
    listTemplates,
    getAllSchemas
} from './templateLoader.js';

// Built-in templates (legacy, embedded in JS)
const BUILT_IN_TEMPLATES = {
    contract: CONTRACT_TEMPLATE,
    order_hiring: HIRING_ORDER_TEMPLATE,
    application: EMPLOYMENT_APPLICATION_TEMPLATE,
    vacation_application: VACATION_APPLICATION_TEMPLATE,
    vacation_order: VACATION_ORDER_TEMPLATE,
    termination_order: TERMINATION_ORDER_TEMPLATE,
    employment_certificate: EMPLOYMENT_CERTIFICATE_TEMPLATE,
    addendum: ADDENDUM_TEMPLATE,
};

// Built-in schemas (hardcoded for legacy types)
const BUILT_IN_SCHEMAS = {
    contract: {
        templateName: 'Трудовой договор',
        type: 'generated',
        required: ['iban'],
        variables: { iban: { type: 'string', description: 'IBAN сотрудника' } },
    },
    order_hiring: {
        templateName: 'Приказ о приеме',
        type: 'generated',
        required: [],
        variables: {},
    },
    application: {
        templateName: 'Заявление на прием',
        type: 'generated',
        required: [],
        variables: {},
    },
    vacation_application: {
        templateName: 'Заявление на отпуск',
        type: 'employee_application',
        required: ['vacationDays', 'vacationStart', 'vacationEnd'],
        variables: {
            vacationDays: { type: 'number', description: 'Дней отпуска' },
            vacationStart: { type: 'date', description: 'Дата начала' },
            vacationEnd: { type: 'date', description: 'Дата окончания' },
        },
    },
    vacation_order: {
        templateName: 'Приказ на отпуск',
        type: 'employer_order',
        required: ['vacationDays', 'vacationStart', 'vacationEnd'],
        variables: {
            vacationDays: { type: 'number', description: 'Дней отпуска' },
            vacationStart: { type: 'date', description: 'Дата начала' },
            vacationEnd: { type: 'date', description: 'Дата окончания' },
        },
    },
    termination_order: {
        templateName: 'Приказ об увольнении',
        type: 'employer_order',
        required: ['terminationDate', 'terminationReason'],
        variables: {
            terminationDate: { type: 'date', description: 'Дата увольнения' },
            terminationReason: { type: 'string', description: 'Причина увольнения' },
            contractNumber: { type: 'string', description: '№ договора' },
            contractDate: { type: 'date', description: 'Дата договора' },
        },
    },
    employment_certificate: {
        templateName: 'Справка с места работы',
        type: 'generated',
        required: ['salary'],
        variables: {
            salary: { type: 'number', description: 'Зарплата (₸)' },
        },
    },
    addendum: {
        templateName: 'Доп. соглашение',
        type: 'mutual_agreement',
        required: ['contractNumber', 'contractDate'],
        variables: {
            contractNumber: { type: 'string', description: '№ договора' },
            contractDate: { type: 'date', description: 'Дата договора' },
            changeTopic: { type: 'string', description: 'Тема изменений' },
        },
    },
};

export function getTemplate(type) {
    // Prefer file-based templates
    const fileTemplate = getFileTemplate(type);
    if (fileTemplate) return fileTemplate;
    // Fallback to built-in
    return BUILT_IN_TEMPLATES[type] || null;
}

export function getSchema(type) {
    const fileSchema = getFileSchema(type);
    if (fileSchema) return fileSchema;
    return BUILT_IN_SCHEMAS[type] || null;
}

export function isRegisteredType(type) {
    return !!getTemplate(type);
}

export function listAllTemplates() {
    const fileList = listTemplates();
    const builtInKeys = Object.keys(BUILT_IN_SCHEMAS);
    const result = [...fileList];

    for (const key of builtInKeys) {
        if (!result.find(t => t.key === key)) {
            const schema = BUILT_IN_SCHEMAS[key];
            result.push({
                key,
                name: schema.templateName,
                type: schema.type,
                fileName: null,
                required: schema.required,
                variables: Object.keys(schema.variables || {}),
            });
        }
    }

    return result;
}

// Process-centric mappings: which document types belong to which HR process
const PROCESS_DEFINITIONS = {
    hiring: {
        label: 'Приём на работу',
        description: 'Пакет документов для оформления нового сотрудника',
        documentTypes: ['13_zayavlenie-o-prieme-na-rabotu', '14_prikaz-o-prieme-na-rabotu', '15_trudovoy-dogovor'],
        editableParams: ['probationMonths', 'contractEndDate', 'vacationDays'],
        requiresEmployerSignature: true,
    },
    vacation: {
        label: 'Отпуск',
        description: 'Заявление и приказ на отпуск',
        documentTypes: ['vacation_application', 'vacation_order'],
        editableParams: ['vacationDays', 'vacationStart', 'vacationEnd'],
        requiresEmployerSignature: true,
    },
    termination: {
        label: 'Расторжение ТД',
        description: 'Соглашение о расторжении трудового договора по согласованию сторон',
        documentTypes: ['11_soglashenie-o-rastorzhenii-trudovogo-dogovora'],
        editableParams: ['terminationDate', 'lastWorkingDay', 'compensationAmount'],
        requiresEmployerSignature: true,
    },
    maternity_leave: {
        label: 'Декрет / Отпуск по беременности',
        description: 'Документы для оформления декретного отпуска',
        documentTypes: ['09_zayavlenie-na-otpusk-po-beremennosti', '04_prikaz-ob-otpuske-po-beremennosti-i-rodam'],
        editableParams: ['vacationStart', 'vacationEnd'],
        requiresEmployerSignature: true,
    },
    maternity_return: {
        label: 'Выход из декрета',
        description: 'Документы для выхода на работу после декрета',
        documentTypes: ['01_zayavlenie-o-vyhode-s-dekreta', '07_prikaz-o-vyhode-iz-otpuska-po-uhodu'],
        editableParams: ['returnDate'],
        requiresEmployerSignature: true,
    },
    name_change: {
        label: 'Изменение ФИО',
        description: 'Приказ и доп. соглашение об изменении фамилии',
        documentTypes: ['06_prikaz-o-vnesenii-izmeneniy-v-fio', '12_dop-soglashenie-ob-izmenenii-familii'],
        editableParams: ['newSurname', 'newName', 'newPatronymic'],
        requiresEmployerSignature: true,
    },
    data_change: {
        label: 'Изменение персональных данных',
        description: 'Заявление об изменении персональных данных',
        documentTypes: ['03_zayavlenie-ob-izmenenii-personalnyh-dannyh'],
        editableParams: ['changeTopic', 'newValue'],
        requiresEmployerSignature: true,
    },
};

export function getProcessDefinition(processType) {
    return PROCESS_DEFINITIONS[processType] || null;
}

export function listProcesses() {
    return Object.entries(PROCESS_DEFINITIONS).map(([key, def]) => ({
        key,
        label: def.label,
        description: def.description,
        documentCount: def.documentTypes.length,
        requiresEmployerSignature: def.requiresEmployerSignature,
    }));
}

export { getAllSchemas };
