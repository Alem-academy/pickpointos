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

export { getAllSchemas };
