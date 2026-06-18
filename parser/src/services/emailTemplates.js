/**
 * Email subject/body templates for document emails.
 */

const DOCUMENT_LABELS = {
    contract: 'Трудовой договор',
    order_hiring: 'Приказ о приёме на работу',
    application: 'Заявление на приём на работу',
    vacation_application: 'Заявление на отпуск',
    vacation_order: 'Приказ на отпуск',
    termination_order: 'Приказ об увольнении',
    employment_certificate: 'Справка с места работы',
    addendum: 'Дополнительное соглашение',
    '01_zayavlenie-o-vyhode-s-dekreta': 'Заявление о выходе с декрета',
    '02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom': 'Заявление на отпуск без сохранения ЗП',
    '03_zayavlenie-ob-izmenenii-personalnyh-dannyh': 'Заявление об изменении персональных данных',
    '04_prikaz-ob-otpuske-po-beremennosti-i-rodam': 'Приказ об отпуске по беременности и родам',
    '05_prikaz-o-prodlenii-otpuska-po-beremennosti': 'Приказ о продлении отпуска по беременности и родам',
    '06_prikaz-o-vnesenii-izmeneniy-v-fio': 'Приказ о внесении изменений в ФИО',
    '07_prikaz-o-vyhode-iz-otpuska-po-uhodu': 'Приказ о выходе из отпуска по уходу за ребёнком',
    '08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu': 'Приказ об отпуске без сохранения ЗП',
    '09_zayavlenie-na-otpusk-po-beremennosti': 'Заявление на отпуск по беременности и родам',
    '10_zayavlenie-na-prodlenie-otpuska-po-beremennosti': 'Заявление на продление отпуска по беременности и родам',
    '11_soglashenie-o-rastorzhenii-trudovogo-dogovora': 'Соглашение о расторжении трудового договора',
    '12_dop-soglashenie-ob-izmenenii-familii': 'Дополнительное соглашение об изменении фамилии',
    '13_zayavlenie-o-prieme-na-rabotu': 'Заявление о приёме на работу',
    '14_prikaz-o-prieme-na-rabotu': 'Приказ о приёме на работу',
    '15_trudovoy-dogovor': 'Трудовой договор',
    '16_zayavlenie-na-otpusk': 'Заявление на отпуск',
    '17_prikaz-ob-otpuske': 'Приказ об отпуске',
    '18_zayavlenie-na-uvolnenie': 'Заявление на увольнение',
    '19_prikaz-ob-uvolnenii': 'Приказ об увольнении',
    '20_spravka-s-mesta-raboty': 'Справка с места работы',
};

export function getDocumentLabel(docType) {
    return DOCUMENT_LABELS[docType] || 'Документ';
}

export function buildEmailContent(docType, employeeName) {
    const label = getDocumentLabel(docType);
    const subject = `Документ: ${label}`;
    const html = `
        <p>Здравствуйте${employeeName ? ', ' + employeeName : ''}.</p>
        <p>Во вложении находится документ «${label}».</p>
        <p>Если у вас есть вопросы, свяжитесь с кадровой службой.</p>
        <br>
        <p>---</p>
        <p>С уважением,<br>Кадровая служба</p>
    `.trim();
    return { subject, html };
}
