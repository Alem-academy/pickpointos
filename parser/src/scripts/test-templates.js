import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.resolve(__dirname, '../../document-templates');
const OUTPUT_DIR = path.join(TEMPLATES_DIR, 'test-output');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Test data from Матрица реквизитов
const testEmployer = {
    name: 'Индивидуальный предприниматель «Жасмин»',
    short_name: 'Жасмин',
    iin: '910729401967',
    director_name: 'Карабаева Г.Е.',
    director_name_dative: 'Карабаевой Г.Е.',
    address: 'г.Алматы, Бурундайская, дом 93 А',
    bank: 'АО «Kaspi Bank»',
    bik: 'CASPKZKA',
    iban: 'KZ54722S000009084425',
};

const testEmployee = {
    full_name: 'Локутневская Дарья Максимовна',
    iin: '021230650637',
    address: 'г. Астана, Евгений Брусиловского 22, кв. 87',
    registered_address: 'РК, обл. Акмолинская, Целиноградский р-н, Аккайын, учетный квартал 088, дом 159',
    phone: '7747987016',
    email: 'daryalokutnevskaya2002@gmail.com',
    id_card_number: '056957700',
    id_card_issued_by: 'МВД РК',
    id_card_issue_date: '2023-12-15',
    role: 'manager',
    pvz_address: 'Сатпаев, ул. Улытауская, д. 90',
    hired_at: '2026-04-28',
};

// Simple template filler (same as fillTemplate in templates.js)
function fillTemplate(template, data) {
    let content = template;
    for (const key in data) {
        const placeholder = '{{' + key + '}}';
        const value = data[key] !== undefined && data[key] !== '' ? data[key] : '__________';
        content = content.split(placeholder).join(value);
    }
    return content;
}

// Load schema
const schemasRaw = fs.readFileSync(path.join(TEMPLATES_DIR, 'template-schemas.json'), 'utf8');
const schemas = JSON.parse(schemasRaw).schemas;

// Generate test output for each template
const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).sort();

for (const file of files) {
    const key = file.replace('.html', '');
    const schema = schemas[key];

    if (!schema) {
        console.log(`⚠️ No schema for ${key}, skipping`);
        continue;
    }

    const template = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');

    // Build test data
    const now = new Date();
    const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const MONTHS_KZ = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
    const MONTHS_KZ_LOC = ['қаңтардағы','ақпандағы','наурыздағы','сәуірдегі','мамырдағы','маусымдағы','шілдедегі','тамыздағы','қыркүйектегі','қазандағы','қарашадағы','желтоқсандағы'];
    const MONTHS_KZ_ABL = ['қаңтардан','ақпаннан','наурыздан','сәуірден','мамырдан','маусымнан','шілдеден','тамыздан','қыркүйектен','қазаннан','қарашадан','желтоқсаннан'];
    const MONTHS_KZ_DATIVE = ['қаңтарға','ақпанға','наурызға','сәуірге','мамырға','маусымға','шілдеге','тамызға','қыркүйекке','қазанға','қарашаға','желтоқсанға'];

    const data = {};
    for (const varName of Object.keys(schema.variables || {})) {
        // Default values based on variable name patterns
        if (varName.includes('employerName')) data[varName] = testEmployer.name;
        else if (varName.includes('employerShort')) data[varName] = testEmployer.short_name;
        else if (varName.includes('employerBIN')) data[varName] = testEmployer.iin;
        else if (varName.includes('employerIIN')) data[varName] = testEmployer.iin;
        else if (varName === 'employerAddressKz') data[varName] = 'Алматы қ., Сәтбаев к-сі, 30/8, кеңсе 139';
        else if (varName === 'employerAddressRegRu') data[varName] = testEmployer.registered_address || testEmployer.address;
        else if (varName === 'employerAddressRegKz') data[varName] = 'Алматы қ., Сәтбаев к-сі, 30/8, кеңсе 139';
        else if (varName.includes('employerAddress')) data[varName] = testEmployer.address;
        else if (varName.includes('employerBank')) data[varName] = testEmployer.bank;
        else if (varName.includes('employerBIK') || varName.includes('employerBIC')) data[varName] = testEmployer.bik;
        else if (varName.includes('employerIBAN') || varName.includes('employerAccount')) data[varName] = testEmployer.iban;
        else if (varName === 'directorNameShort') data[varName] = testEmployer.director_name;
        else if (varName === 'directorNameRod') data[varName] = 'Карабаевой Г.Е.';
        else if (varName.includes('directorName') && varName.includes('Dat')) data[varName] = testEmployer.director_name_dative;
        else if (varName.includes('directorName')) data[varName] = testEmployer.director_name;
        else if (varName.includes('directorBasisKz')) data[varName] = 'Жарғысы';
        else if (varName.includes('directorBasis')) data[varName] = 'Устава';
        else if (varName === 'employeeFullNameShort') data[varName] = 'Локутневской Д.М.';
        else if (varName.includes('employeeFullNameShort') && varName.includes('Vin')) data[varName] = 'Локутневскую Д.М.';
        else if (varName.includes('employeeFullNameShort') && varName.includes('Rod')) data[varName] = 'Локутневской Д.М.';
        else if (varName.includes('employeeFullNameShort') && varName.includes('Dat')) data[varName] = 'Локутневской Д.М.';
        else if (varName.includes('employeeFullNameShort')) data[varName] = 'Локутневская Д.М.';
        else if (varName.includes('employeeFullName') && varName.includes('Vin')) data[varName] = 'Локутневскую Дарью Максимовну';
        else if (varName.includes('employeeFullName') && varName.includes('Rod')) data[varName] = 'Локутневской Дарьи Максимовны';
        else if (varName.includes('employeeFullName') && varName.includes('Dat')) data[varName] = 'Локутневской Дарье Максимовне';
        else if (varName.includes('employeeFullName') && varName.includes('Inst')) data[varName] = 'Локутневской Дарьей Максимовной';
        else if (varName === 'employeeFullNameKz') data[varName] = testEmployee.full_name;
        else if (varName.includes('employeeFullName')) data[varName] = testEmployee.full_name;
        else if (varName === 'employeeCitizen') data[varName] = 'гражданин';
        else if (varName === 'employeeResidentAdj') data[varName] = 'проживающий';
        else if (varName === 'employeeAcknowledged') data[varName] = 'ознакомлен';
        else if (varName === 'employeeReturned') data[varName] = 'приступившим';
        else if (varName === 'directorActing') data[varName] = 'действующей';
        else if (varName.includes('employeePosition') && varName.includes('Rod')) data[varName] = 'менеджера по работе с клиентами';
        else if (varName.includes('employeePosition') && varName.includes('Dat')) data[varName] = 'менеджеру по работе с клиентами';
        else if (varName.includes('employeePosition') && varName.includes('Inst')) data[varName] = 'менеджером по работе с клиентами';
        else if (varName.includes('employeePosition')) data[varName] = 'Менеджер по работе с клиентами / Клиенттермен жұмыс жөніндегі менеджер';
        else if (varName.includes('employeeIIN')) data[varName] = testEmployee.iin;
        else if (varName.includes('employeeAddressKz')) data[varName] = 'ҚР, Ақмола облысы, Целиноград ауданы, Аккайын, есептік квартал 088, үй 159';
        else if (varName.includes('employeeAddressResidentKz')) data[varName] = 'Астана қаласы, Евгений Брусиловского 22, 87 пәтер';
        else if (varName.includes('employeeAddressResidentRu')) data[varName] = testEmployee.address;
        else if (varName.includes('employeeAddressRegKz')) data[varName] = 'ҚР, Ақмола облысы, Целиноград ауданы, Аккайын, есептік квартал 088, 159 үй';
        else if (varName.includes('employeeAddressRegRu')) data[varName] = testEmployee.registered_address;
        else if (varName.includes('employeeAddress')) data[varName] = testEmployee.registered_address;
        else if (varName.includes('employeePhone')) data[varName] = testEmployee.phone;
        else if (varName.includes('employeeEmail')) data[varName] = testEmployee.email;
        else if (varName.includes('employeeBank')) data[varName] = testEmployer.bank;
        else if (varName.includes('employeeBankDetails')) data[varName] = testEmployer.iban;
        else if (varName.includes('idCardNumber') || varName.includes('employeeIdNumber')) data[varName] = testEmployee.id_card_number;
        else if (varName.includes('idCardIssueDate') || varName.includes('employeeIdDate')) data[varName] = '15.12.2023';
        else if (varName === 'idCardIssueDay') data[varName] = '15';
        else if (varName === 'idCardIssueMonthRu') data[varName] = 'декабря';
        else if (varName === 'idCardIssueYear') data[varName] = '2023';
        else if (varName.includes('idCardIssuerKz')) data[varName] = 'ҚР ІІМ';
        else if (varName.includes('idCardIssuer')) data[varName] = testEmployee.id_card_issued_by;
        else if (varName.includes('workplaceAddressKz')) data[varName] = 'Сатпаев, Ұлытау көшесі, 90 үй';
        else if (varName.includes('workplaceAddress')) data[varName] = testEmployee.pvz_address;
        else if (varName.includes('cityKz') || varName.includes('cityRu')) data[varName] = 'Алматы';
        else if (varName === 'city') data[varName] = 'Алматы';
        else if (varName === 'currentDateDay') data[varName] = String(now.getDate());
        else if (varName === 'currentDateMonthRu') data[varName] = MONTHS_RU[now.getMonth()];
        else if (varName === 'currentDateMonthKz') data[varName] = MONTHS_KZ[now.getMonth()];
        else if (varName === 'currentDateYear') data[varName] = String(now.getFullYear());
        else if (varName === 'currentDateNumeric') data[varName] = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
        else if (varName === 'orderDateNumeric') data[varName] = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} г.`;
        else if (varName.includes('currentDate')) data[varName] = `${now.getDate()} ${MONTHS_RU[now.getMonth()]} ${now.getFullYear()} г.`;
        else if (varName === 'dateDay') data[varName] = '28';
        else if (varName.includes('DateDay') || varName.includes('StartDay') || varName.includes('EndDay')) data[varName] = '28';
        else if (varName === 'contractDateMonthKzLoc') data[varName] = MONTHS_KZ_LOC[now.getMonth()];
        else if (varName === 'contractStartDateMonthKzAbl') data[varName] = MONTHS_KZ_ABL[now.getMonth()];
        else if (varName === 'contractEndDateMonthKzDat') data[varName] = MONTHS_KZ_DATIVE[now.getMonth()];
        else if (varName.includes('dateMonthKz') || varName.includes('MonthKz')) data[varName] = MONTHS_KZ[now.getMonth()];
        else if (varName.includes('dateMonthRu') || varName.includes('MonthRu')) data[varName] = MONTHS_RU[now.getMonth()];
        else if (varName === 'dateMonth') data[varName] = MONTHS_RU[now.getMonth()];
        else if (varName === 'dateYear') data[varName] = String(now.getFullYear());
        else if (varName === 'contractEndDateYear') data[varName] = String(now.getFullYear() + 1);
        else if (varName.includes('DateYear') || varName.includes('StartYear') || varName.includes('EndYear')) data[varName] = String(now.getFullYear());
        else if (varName.includes('orderNumber')) data[varName] = '001-К';
        else if (varName.includes('contractNumber')) data[varName] = 'ТД-001/26';
        else if (varName.includes('contractDateDay') || varName.includes('startDateDay')) data[varName] = '28';
        else if (varName.includes('contractDateMonthKz') || varName.includes('startDateMonthKz')) data[varName] = MONTHS_KZ[now.getMonth()];
        else if (varName.includes('contractDateMonthRu') || varName.includes('startDateMonthRu')) data[varName] = MONTHS_RU[now.getMonth()];
        else if (varName.includes('contractDateYear') || varName.includes('startDateYear')) data[varName] = String(now.getFullYear());
        else if (varName.includes('contractDate')) data[varName] = '28.04.2026';
        else if (varName.includes('agreementNumber')) data[varName] = '1';
        else if (varName.includes('agreementDate')) data[varName] = '28.04.2026';
        else if (varName === 'terminationDateDay') data[varName] = '15';
        else if (varName === 'terminationDateMonthRu') data[varName] = 'марта';
        else if (varName === 'terminationDateYear') data[varName] = '2026';
        else if (varName === 'terminationDateMonthKz') data[varName] = 'наурыз';
        else if (varName.includes('terminationDate')) data[varName] = '15 марта 2026 года';
        else if (varName.includes('lastWorkingDay')) data[varName] = '15 марта 2026';
        else if (varName === 'vacationPartTitle') data[varName] = '(части трудового отпуска)';
        else if (varName === 'vacationDays') data[varName] = '126';
        else if (varName === 'vacationDaysText') data[varName] = 'сто двадцать шесть';
        else if (varName.includes('vacationDays')) data[varName] = '126';
        else if (varName.includes('unusedVacationDays')) data[varName] = '8';
        else if (varName.includes('vacationStartDate')) data[varName] = '15 октября 2025 года';
        else if (varName.includes('vacationEndDate')) data[varName] = '17 февраля 2026 года';
        else if (varName.includes('returnDate')) data[varName] = '12 сентября 2025 года';
        else if (varName.includes('startDate')) data[varName] = '28 апреля 2026 года';
        else if (varName === 'probationPeriodKz') data[varName] = 'үш ай';
        else if (varName.includes('probationPeriod')) data[varName] = 'три месяца';
        else if (varName === 'salaryAmountRu') data[varName] = '300 000 (триста тысяч) тенге';
        else if (varName === 'salaryAmountKz') data[varName] = '300 000 (үш жүз мың) теңге';
        else if (varName.includes('workSchedule')) data[varName] = '5/2, с 09:00 до 18:00';
        else if (varName.includes('certificateNumber')) data[varName] = '10312626';
        else if (varName.includes('certificateDate')) data[varName] = '29 декабря 2025 года';
        else if (varName.includes('sickLeaveNumber')) data[varName] = '9799774';
        else if (varName.includes('sickLeaveSeries')) data[varName] = 'БД';
        else if (varName.includes('sickLeaveDate')) data[varName] = '15 октября 2025 года';
        else if (varName.includes('applicationDate')) data[varName] = '10.10.2025';
        else if (varName.includes('oldLastName')) data[varName] = 'Иванова';
        else if (varName.includes('newLastName')) data[varName] = 'Петрова';
        else if (varName.includes('changeReason')) data[varName] = 'вступления в брак';
        else if (varName.includes('marriageCertNumber')) data[varName] = '3421831';
        else if (varName.includes('marriageCertDate')) data[varName] = '19.12.2025';
        else if (varName.includes('marriageCertIssuer')) data[varName] = 'Отдел №2 города Караганды по РАГС';
        else if (varName.includes('compensationAmount')) data[varName] = '150 000 ₸';
        else if (varName === 'handoverPosition') data[varName] = 'менеджеру по работе с клиентами';
        else if (varName === 'handoverEmployeeName') data[varName] = 'Ковалеву Владимиру Николаевичу';
        else if (varName === 'employeeIdIssuerRu') data[varName] = 'МВД РК';
        else if (varName.includes('employeeFullNameOld')) data[varName] = 'Иванова Мария Петровна';
        else data[varName] = '__________';
    }

    // Ensure any placeholder used in the template has a value, even if not declared in schema
    const templatePlaceholders = [...template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map(m => m[1]);
    for (const ph of templatePlaceholders) {
        if (!(ph in data)) {
            data[ph] = '__________';
        }
    }

    const html = fillTemplate(template, data);
    const outputPath = path.join(OUTPUT_DIR, file);
    fs.writeFileSync(outputPath, html, 'utf8');

    // Count unfilled variables
    const unfilled = (html.match(/\{\{[a-zA-Z0-9_]+\}\}/g) || []);
    console.log(`✅ ${key}: ${unfilled.length === 0 ? 'OK' : unfilled.length + ' unfilled: ' + [...new Set(unfilled)].join(', ')}`);
}

console.log(`\n📁 Test outputs saved to: ${OUTPUT_DIR}`);
