/**
 * Document type display helpers
 */

export interface DocumentTypeConfig {
    type: string;
    label: string;
    labelShort: string;
    icon: string;
    category: 'generated' | 'uploaded' | 'system';
    color: string;
}

export const DOCUMENT_TYPES: Record<string, DocumentTypeConfig> = {
    // Generated documents
    contract: {
        type: 'contract',
        label: 'Трудовой договор',
        labelShort: 'Договор',
        icon: 'FileText',
        category: 'generated',
        color: 'blue'
    },
    order_hiring: {
        type: 'order_hiring',
        label: 'Приказ о приеме на работу',
        labelShort: 'Приказ о приеме',
        icon: 'FileCheck',
        category: 'generated',
        color: 'emerald'
    },
    application: {
        type: 'application',
        label: 'Заявление на прием на работу',
        labelShort: 'Заявление',
        icon: 'FileEdit',
        category: 'generated',
        color: 'amber'
    },
    vacation_application: {
        type: 'vacation_application',
        label: 'Заявление на отпуск',
        labelShort: 'Заявление на отпуск',
        icon: 'Plane',
        category: 'generated',
        color: 'purple'
    },
    vacation_order: {
        type: 'vacation_order',
        label: 'Приказ на отпуск',
        labelShort: 'Приказ на отпуск',
        icon: 'CalendarCheck',
        category: 'generated',
        color: 'purple'
    },
    termination_order: {
        type: 'termination_order',
        label: 'Приказ об увольнении',
        labelShort: 'Приказ об увольнении',
        icon: 'UserX',
        category: 'generated',
        color: 'red'
    },
    employment_certificate: {
        type: 'employment_certificate',
        label: 'Справка с места работы',
        labelShort: 'Справка',
        icon: 'Award',
        category: 'generated',
        color: 'slate'
    },
    addendum: {
        type: 'addendum',
        label: 'Дополнительное соглашение',
        labelShort: 'Доп. соглашение',
        icon: 'FileSignature',
        category: 'generated',
        color: 'indigo'
    },
    '13_zayavlenie-o-prieme-na-rabotu': {
        type: '13_zayavlenie-o-prieme-na-rabotu',
        label: 'Заявление о приеме на работу',
        labelShort: 'Заявление о приеме',
        icon: 'FileEdit',
        category: 'generated',
        color: 'amber'
    },
    '14_prikaz-o-prieme-na-rabotu': {
        type: '14_prikaz-o-prieme-na-rabotu',
        label: 'Приказ о приеме на работу',
        labelShort: 'Приказ о приеме',
        icon: 'FileCheck',
        category: 'generated',
        color: 'emerald'
    },
    '15_trudovoy-dogovor': {
        type: '15_trudovoy-dogovor',
        label: 'Трудовой договор',
        labelShort: 'Трудовой договор',
        icon: 'FileText',
        category: 'generated',
        color: 'blue'
    },
    '16_zayavlenie-na-otpusk': {
        type: '16_zayavlenie-na-otpusk',
        label: 'Заявление на отпуск',
        labelShort: 'Заявление на отпуск',
        icon: 'Plane',
        category: 'generated',
        color: 'purple'
    },
    '17_prikaz-ob-otpuske': {
        type: '17_prikaz-ob-otpuske',
        label: 'Приказ об отпуске',
        labelShort: 'Приказ об отпуске',
        icon: 'CalendarCheck',
        category: 'generated',
        color: 'purple'
    },
    '18_zayavlenie-na-uvolnenie': {
        type: '18_zayavlenie-na-uvolnenie',
        label: 'Заявление на увольнение',
        labelShort: 'Заявление на увольнение',
        icon: 'FileEdit',
        category: 'generated',
        color: 'red'
    },
    '19_prikaz-ob-uvolnenii': {
        type: '19_prikaz-ob-uvolnenii',
        label: 'Приказ об увольнении',
        labelShort: 'Приказ об увольнении',
        icon: 'UserX',
        category: 'generated',
        color: 'red'
    },
    '20_spravka-s-mesta-raboty': {
        type: '20_spravka-s-mesta-raboty',
        label: 'Справка с места работы',
        labelShort: 'Справка с места работы',
        icon: 'Award',
        category: 'generated',
        color: 'slate'
    },
    // Uploaded documents
    id_main: {
        type: 'id_main',
        label: 'Удостоверение личности (Лицевая сторона)',
        labelShort: 'УДЛ (Лиц.)',
        icon: 'IdCard',
        category: 'uploaded',
        color: 'indigo'
    },
    id_register: {
        type: 'id_register',
        label: 'Удостоверение личности (Оборотная сторона)',
        labelShort: 'УДЛ (Обор.)',
        icon: 'IdCard',
        category: 'uploaded',
        color: 'indigo'
    },
    id_scan: {
        type: 'id_scan',
        label: 'Скан удостоверения личности',
        labelShort: 'УДЛ Скан',
        icon: 'Scan',
        category: 'uploaded',
        color: 'indigo'
    },
    photo: {
        type: 'photo',
        label: 'Фотография 3х4',
        labelShort: 'Фото',
        icon: 'Image',
        category: 'uploaded',
        color: 'pink'
    },
    cert_075: {
        type: 'cert_075',
        label: 'Медицинская справка 075/у',
        labelShort: 'Справка 075/у',
        icon: 'Stethoscope',
        category: 'uploaded',
        color: 'green'
    },
    cert_tb: {
        type: 'cert_tb',
        label: 'Справка тубдиспансер',
        labelShort: 'Тубдиспансер',
        icon: 'Activity',
        category: 'uploaded',
        color: 'green'
    },
    bank_details: {
        type: 'bank_details',
        label: 'Справка IBAN / Банковские реквизиты',
        labelShort: 'IBAN',
        icon: 'Banknote',
        category: 'uploaded',
        color: 'emerald'
    },
    address_cert: {
        type: 'address_cert',
        label: 'Адресная справка',
        labelShort: 'Адрес',
        icon: 'MapPin',
        category: 'uploaded',
        color: 'orange'
    },
    other: {
        type: 'other',
        label: 'Другой документ',
        labelShort: 'Другое',
        icon: 'File',
        category: 'uploaded',
        color: 'gray'
    }
};

export function getDocumentTypeConfig(type: string): DocumentTypeConfig {
    return DOCUMENT_TYPES[type] || DOCUMENT_TYPES.other;
}

export function getDocumentLabel(type: string): string {
    return getDocumentTypeConfig(type).label;
}

export function getDocumentLabelShort(type: string): string {
    return getDocumentTypeConfig(type).labelShort;
}

export function getDocumentIcon(type: string): string {
    return getDocumentTypeConfig(type).icon;
}

export function getDocumentColor(type: string): string {
    return getDocumentTypeConfig(type).color;
}

export function isGeneratedDocument(type: string): boolean {
    return getDocumentTypeConfig(type).category === 'generated';
}

export function isUploadedDocument(type: string): boolean {
    return getDocumentTypeConfig(type).category === 'uploaded';
}
