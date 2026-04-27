# Документация по HTML-шаблонам документов для ЭЦП

## Общая информация

Все шаблоны находятся в директории `document-templates/` и предназначены для генерации документов на подпись (ЭЦП). Шаблоны используют синтаксис переменных `{{variableName}}` для подстановки данных из системы.

## Структура директории

```
document-templates/
├── 01_zayavlenie-o-vyhode-s-dekreta.html
├── 02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom.html
├── 03_zayavlenie-ob-izmenenii-personalnyh-dannyh.html
├── 04_prikaz-ob-otpuske-po-beremennosti-i-rodam.html
├── 05_prikaz-o-prodlenii-otpuska-po-beremennosti.html
├── 06_prikaz-o-vnesenii-izmeneniy-v-fio.html
├── 07_prikaz-o-vyhode-iz-otpuska-po-uhodu.html
├── 08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu.html
├── 09_zayavlenie-na-otpusk-po-beremennosti.html
├── 10_zayavlenie-na-prodlenie-otpuska-po-beremennosti.html
├── 11_soglashenie-o-rastorzhenii-trudovogo-dogovora.html
├── 12_dop-soglashenie-ob-izmenenii-familii.html
└── TEMPLATE_DOCUMENTATION.md
```

## Соглашения по именованию

### Формат переменных
- Используется синтаксис Mustache: `{{variableName}}`
- Имена переменных в camelCase
- Только латинские символы

### Падежи в переменных
- `*Rod` — родительный падеж (кого? чего?)
- `*Dat` — дательный падеж (кому? чему?)
- Без суффикса — именительный падеж (кто? что?)

### Даты
Даты разбиты на составляющие для гибкости:
- `{{dateDay}}` — день числом
- `{{dateMonth}}` — месяц на русском (января, февраля...)
- `{{dateMonthKz}}` — месяц на казахском (қаңтар, ақпан...)
- `{{dateYear}}` — год
- `{{currentDate}}` — полная дата в свободном формате

## Стили и верстка

### Базовые принципы
- Каждый шаблон самодостаточен (встроенные `<style>`)
- Размер страницы: A4 (`210mm x 297mm`)
- Шрифт: Times New Roman, 12-14pt
- Отступы: 15-20mm
- Черный цвет текста (`#000`)

### Печать
Все шаблоны содержат CSS-правило:
```css
@page { size: A4; margin: 20mm; }
```

### Генерация PDF
Для генерации PDF рекомендуется использовать Puppeteer, Playwright или аналогичный инструмент с поддержкой `@page`:
```javascript
const puppeteer = require('puppeteer');
const html = renderTemplate(templateString, data);
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.pdf({ format: 'A4', printBackground: true });
```

## Переменные по шаблонам

### 01. Заявление о выходе с декрета
`01_zayavlenie-o-vyhode-s-dekreta.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | ИП «Жасмин» |
| `directorNameShort` | ФИО директора, дат. падеж | Карабаевой Г.Е. |
| `employeePosition` | Должность сотрудника | менеджера по работе с клиентами |
| `employeeFullName` | ФИО сотрудника полностью | Иванова Мария Петровна |
| `returnDateDay` | День выхода на работу | 15 |
| `returnDateMonth` | Месяц выхода | октября |
| `returnDateYear` | Год выхода | 2025 |
| `currentDateDay` | День подписания | 10 |
| `currentDateMonth` | Месяц подписания | октября |
| `currentDateYear` | Год подписания | 2025 |

---

### 02. Заявление на отпуск по уходу за ребенком
`02_zayavlenie-na-otpusk-po-uhodu-za-rebenkom.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | ИП «Жасмин» |
| `directorNameShort` | ФИО директора, дат. падеж | Карабаевой Г.Е. |
| `employeePosition` | Должность | менеджера по работе с клиентами |
| `employeeFullName` | ФИО полностью | Иванова Мария Петровна |
| `employeeIIN` | ИИН | 940101400123 |
| `employeeAddress` | Адрес проживания | г. Алматы, пр. Назарбаева 10 |
| `employeePhone` | Телефон | +7 701 123 4567 |
| `vacationStartDay` | День начала | 18 |
| `vacationStartMonth` | Месяц начала | февраля |
| `vacationStartYear` | Год начала | 2026 |
| `vacationEndDay` | День окончания | 25 |
| `vacationEndMonth` | Месяц окончания | декабря |
| `vacationEndYear` | Год окончания | 2028 |
| `certificateNumber` | № свидетельства о рождении | 10312626 |
| `certificateDay` | День свидетельства | 29 |
| `certificateMonth` | Месяц свидетельства | декабря |
| `certificateYear` | Год свидетельства | 2025 |
| `currentDate` | Дата подписания | 15 февраля 2026 г. |

---

### 03. Заявление об изменении персональных данных
`03_zayavlenie-ob-izmenenii-personalnyh-dannyh.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | ИП «Жасмин» |
| `directorNameShort` | ФИО директора, дат. падеж | Карабаевой Г.Е. |
| `employeePosition` | Должность | менеджера по работе с клиентами |
| `employeeFullName` | ФИО полностью | Иванова Мария Петровна |
| `employeeIIN` | ИИН | 940101400123 |
| `employeeAddress` | Адрес | г. Алматы, пр. Назарбаева 10 |
| `employeePhone` | Телефон | +7 701 123 4567 |
| `oldLastName` | Прежняя фамилия | Иванова |
| `newLastName` | Новая фамилия | Петрова |
| `changeReason` | Причина изменения | вступления в брак |
| `marriageCertNumber` | № свидетельства о браке | 3421831 |
| `marriageCertDate` | Дата свидетельства | 19.12.2025 |
| `idCardNumber` | № удостоверения | 062778620 |
| `idCardIssuedBy` | Кем выдано | МВД РК |
| `idCardIssueDate` | Дата выдачи | 16.01.2026 |
| `currentDate` | Дата подписания | 30 марта 2026 г. |

---

### 04. Приказ об отпуске по беременности и родам
`04_prikaz-ob-otpuske-po-beremennosti-i-rodam.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | Жасмин |
| `orderNumber` | Номер приказа | 15-К |
| `dateDay` | День | 15 |
| `dateMonthKz` | Месяц (каз) | қазан |
| `dateMonth` | Месяц (рус) | октября |
| `dateYear` | Год | 2025 |
| `cityKz` | Город (каз) | Алматы |
| `city` | Город (рус) | Алматы |
| `employeePositionRod` | Должность, род. падеж | менеджера по работе с клиентами |
| `employeeFullNameRod` | ФИО, род. падеж | Еспулаевой Виктории Александровне |
| `vacationDays` | Количество дней | 126 |
| `vacationDaysText` | Дни прописью | сто двадцать шесть |
| `vacationStartDate` | Дата начала | 15 октября 2025 года |
| `vacationEndDate` | Дата окончания | 17 февраля 2026 года |
| `employeeFullNameShort` | ФИО с инициалами, род. п. | Еспулаевой В. А. |
| `applicationDate` | Дата заявления | 15.10.2025 |
| `sickLeaveDate` | Дата больничного | 15 октября 2025 года |
| `sickLeaveSeries` | Серия больничного | БД |
| `sickLeaveNumber` | Номер больничного | 9799774 |
| `directorNameShort` | ФИО директора | Карабаева Г.Е. |

---

### 05. Приказ о продлении отпуска по беременности и родам
`05_prikaz-o-prodlenii-otpuska-po-beremennosti.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | Жасмин |
| `orderNumber` | Номер приказа | 18-К |
| `dateDay` | День | 18 |
| `dateMonthKz` | Месяц (каз) | ақпан |
| `dateMonth` | Месяц (рус) | февраля |
| `dateYear` | Год | 2026 |
| `cityKz` | Город (каз) | Алматы |
| `city` | Город (рус) | Алматы |
| `employeePositionRod` | Должность, род. падеж | менеджера по работе с клиентами |
| `employeeFullNameRod` | ФИО, род. падеж | Еспулаевой Виктории Александровне |
| `vacationDays` | Дни продления | 14 |
| `vacationDaysText` | Дни прописью | четырнадцать |
| `vacationStartDate` | Дата начала | 18 февраля 2026 года |
| `vacationEndDate` | Дата окончания | 3 марта 2026 года |
| `employeeFullNameShort` | ФИО с инициалами, род. п. | Еспулаевой В. А. |
| `applicationDate` | Дата заявления | 18 февраля 2026 г. |
| `sickLeaveDate` | Дата больничного | 18 февраля 2026 года |
| `sickLeaveSeries` | Серия больничного | БД |
| `sickLeaveNumber` | Номер больничного | 9794484 |
| `directorNameShort` | ФИО директора | Карабаева Г.Е. |

---

### 06. Приказ о внесении изменений в ФИО
`06_prikaz-o-vnesenii-izmeneniy-v-fio.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | Жасмин |
| `orderNumber` | Номер приказа | 30 |
| `dateDay` | День | 30 |
| `dateMonthKz` | Месяц (каз) | наурыз |
| `dateMonth` | Месяц (рус) | марта |
| `dateYear` | Год | 2026 |
| `cityKz` | Город (каз) | Алматы |
| `city` | Город (рус) | Алматы |
| `employeePositionRod` | Должность, род. падеж | менеджера по работе с клиентами |
| `employeeFullNameRod` | ФИО, род. падеж (старое) | Бондаревой Александры Андреевны |
| `oldLastName` | Старая фамилия | Бондарева |
| `newLastName` | Новая фамилия | Рогова |
| `employeeFullNameShort` | ФИО с инициалами | Рогова А.А. |
| `applicationDate` | Дата заявления | 30 марта 2026 г. |
| `marriageCertDate` | Дата свидетельства о браке | 19.12.2025 |
| `marriageCertNumber` | № свидетельства | 3421831 |
| `marriageCertIssuer` | Кем выдано | Отдел №2 города Караганды по РАГС |
| `idCardNumber` | № удостоверения | 062778620 |
| `idCardIssueDate` | Дата выдачи | 16.01.2026 |
| `idCardIssuer` | Кем выдано | МВД РК |
| `directorNameShort` | ФИО директора | Карабаева Г.Е. |

---

### 07. Приказ о выходе из отпуска по уходу за ребенком
`07_prikaz-o-vyhode-iz-otpuska-po-uhodu.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | Жасмин |
| `orderNumber` | Номер приказа | 12-К |
| `dateDay` | День | 12 |
| `dateMonthKz` | Месяц (каз) | қыркүйек |
| `dateMonth` | Месяц (рус) | сентября |
| `dateYear` | Год | 2025 |
| `cityKz` | Город (каз) | Алматы |
| `city` | Город (рус) | Алматы |
| `employeePositionRod` | Должность, род. падеж | менеджера по работе с клиентами |
| `employeeFullNameRod` | ФИО, род. падеж | Шүленбаевой Айдана Нурланқызы |
| `returnDate` | Дата выхода | 12 сентября 2025 года |
| `employeeFullNameShort` | ФИО с инициалами | Шүленбаевой А.Н. |
| `applicationDate` | Дата заявления | 01.09.2025 |
| `directorNameShort` | ФИО директора | Карабаева Г.Е. |

---

### 08. Приказ об отпуске без сохранения ЗП по уходу за ребенком
`08_prikaz-ob-otpuske-bez-sohraneniya-zp-po-uhodu.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | Жасмин |
| `orderNumber` | Номер приказа | 18-К |
| `dateDay` | День | 18 |
| `dateMonthKz` | Месяц (каз) | ақпан |
| `dateMonth` | Месяц (рус) | февраля |
| `dateYear` | Год | 2026 |
| `cityKz` | Город (каз) | Алматы |
| `city` | Город (рус) | Алматы |
| `employeePositionRod` | Должность, род. падеж | менеджера по работе с клиентами |
| `employeeFullNameRod` | ФИО, род. падеж | Еспулаевой Виктории Александровне |
| `vacationStartDate` | Дата начала | 18 февраля 2026 года |
| `vacationEndDate` | Дата окончания | 25 декабря 2028 года |
| `employeeFullNameShort` | ФИО с инициалами | Еспулаевой В.А. |
| `applicationDate` | Дата заявления | 18 февраля 2026 |
| `certificateNumber` | № свидетельства о рождении | 10312626 |
| `certificateDate` | Дата свидетельства | 29 декабря 2025 года |
| `directorNameShort` | ФИО директора | Карабаева Г.Е. |

---

### 09. Заявление на отпуск по беременности и родам
`09_zayavlenie-na-otpusk-po-beremennosti.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | ИП «Жасмин» |
| `directorNameShort` | ФИО директора, дат. падеж | Карабаевой Г.Е. |
| `employeePosition` | Должность | менеджера по работе с клиентами |
| `employeeFullName` | ФИО полностью | Иванова Мария Петровна |
| `employeeIIN` | ИИН | 940101400123 |
| `employeeAddress` | Адрес | г. Алматы, пр. Назарбаева 10 |
| `employeePhone` | Телефон | +7 701 123 4567 |
| `vacationStartDay` | День начала | 15 |
| `vacationStartMonth` | Месяц начала | октября |
| `vacationStartYear` | Год начала | 2025 |
| `vacationEndDay` | День окончания | 17 |
| `vacationEndMonth` | Месяц окончания | февраля |
| `vacationEndYear` | Год окончания | 2026 |
| `sickLeaveNumber` | № больничного | 9799774 |
| `sickLeaveDay` | День больничного | 15 |
| `sickLeaveMonth` | Месяц больничного | октября |
| `sickLeaveYear` | Год больничного | 2025 |
| `currentDate` | Дата подписания | 10 октября 2025 г. |

---

### 10. Заявление на продление отпуска по беременности и родам
`10_zayavlenie-na-prodlenie-otpuska-po-beremennosti.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | ИП «Жасмин» |
| `directorNameShort` | ФИО директора, дат. падеж | Карабаевой Г.Е. |
| `employeePosition` | Должность | менеджера по работе с клиентами |
| `employeeFullName` | ФИО полностью | Иванова Мария Петровна |
| `employeeIIN` | ИИН | 940101400123 |
| `employeeAddress` | Адрес | г. Алматы, пр. Назарбаева 10 |
| `employeePhone` | Телефон | +7 701 123 4567 |
| `vacationStartDay` | День начала продления | 18 |
| `vacationStartMonth` | Месяц начала | февраля |
| `vacationStartYear` | Год начала | 2026 |
| `vacationEndDay` | День окончания | 03 |
| `vacationEndMonth` | Месяц окончания | марта |
| `vacationEndYear` | Год окончания | 2026 |
| `sickLeaveNumber` | № больничного | 9794484 |
| `sickLeaveDay` | День больничного | 18 |
| `sickLeaveMonth` | Месяц больничного | февраля |
| `sickLeaveYear` | Год больничного | 2026 |
| `currentDate` | Дата подписания | 15 февраля 2026 г. |

---

### 11. Соглашение о расторжении трудового договора
`11_soglashenie-o-rastorzhenii-trudovogo-dogovora.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `employerName` | Наименование работодателя | ИП «Жасмин» |
| `directorName` | ФИО директора полностью | Карабаевой Гульнар Ерболовны |
| `directorNameShort` | ФИО директора с инициалами | Карабаева Г.Е. |
| `directorBasis` | Основание полномочий | Устава |
| `employeeFullName` | ФИО работника | Аушахманова Жания Сатыбалдиновна |
| `employeeFullNameShort` | ФИО с инициалами | Аушахманова Ж.С. |
| `employeeIIN` | ИИН | 880101400123 |
| `employeeAddress` | Адрес | г. Алматы, мкр. Ауэзов 15/2 |
| `employeeBank` | Банк | Kaspi Bank |
| `employeeBankDetails` | Реквизиты счета | ИИК KZ86125KZT5001300000 |
| `employeeIdNumber` | № удостоверения | 042123456 |
| `employeeIdDate` | Дата выдачи удостоверения | 15.03.2018 |
| `contractNumber` | № трудового договора | 40/25 |
| `contractDate` | Дата трудового договора | 7 апреля 2025 года |
| `terminationDate` | Дата расторжения | 15 марта 2026 года |
| `agreementDate` | Дата соглашения | 15.03.2026 |
| `city` | Город | Алматы |
| `lastWorkingDay` | Последний рабочий день | 15 марта 2026 |
| `compensationAmount` | Сумма компенсации | 150 000 ₸ |

---

### 12. Доп. соглашение об изменении фамилии
`12_dop-soglashenie-ob-izmenenii-familii.html`

| Переменная | Описание | Пример |
|------------|----------|--------|
| `agreementNumber` | № доп. соглашения | 1 |
| `contractNumber` | № трудового договора | 165/25 |
| `contractDate` | Дата трудового договора | 17 февраля 2025 года |
| `agreementDate` | Дата соглашения | 30 марта 2026 г. |
| `employerName` | Наименование работодателя | ИП «Жасмин» |
| `directorName` | ФИО директора полностью | Карабаевой Гульнар Ерболовны |
| `directorNameShort` | ФИО директора с инициалами | Карабаева Г.Е. |
| `directorBasis` | Основание полномочий | Устава |
| `employeeFullName` | Новое ФИО работника | Рогова Александра Андреевна |
| `employeeFullNameOld` | Старое ФИО работника | Бондарева Александра Андреевна |
| `employeeIIN` | ИИН | 910729401967 |
| `employeeAddress` | Адрес | г. Алматы, ул. Ауэзова 30/8 |
| `employeePosition` | Должность | менеджер по работе с клиентами |
| `oldLastName` | Старая фамилия | Бондарева |
| `newLastName` | Новая фамилия | Рогова |
| `changeReason` | Причина изменения | вступлением в брак |
| `marriageCertNumber` | № свидетельства о браке | 3421831 |
| `marriageCertDate` | Дата свидетельства | 19.12.2025 |
| `idCardNumber` | № удостоверения | 062778620 |
| `idCardIssueDate` | Дата выдачи | 16.01.2026 |
| `employerIIN` | ИИН работодателя | 930101400123 |
| `employerBIN` | БИН работодателя | 930101400123 |
| `employerBank` | Банк работодателя | Kaspi Bank |
| `employerAccount` | Р/с работодателя | KZ86125KZT5001300000 |
| `employerBIC` | БИК банка работодателя | CASPKZKA |
| `employerAddress` | Адрес работодателя | г. Алматы, пр. Назарбаева 93 |
| `employeeBank` | Банк работника | Kaspi Bank |
| `employeeBankDetails` | Р/с работника | KZ86125KZT5001300000 |
| `dateYear` | Год | 2026 |
| `employeeFullNameShort` | ФИО с инициалами | Рогова А.А. |
| `city` | Город | Алматы |

---

## Рекомендации по интеграции

### 1. Рендеринг шаблонов
Рекомендуется использовать легковесный шаблонизатор, например Handlebars или Mustache:

```javascript
import Handlebars from 'handlebars';

const template = Handlebars.compile(templateSource);
const html = template(data);
```

### 2. Подготовка данных
Перед рендерингом необходимо:
1. Склонять ФИО и должности в нужные падежи (использовать морфологический сервис)
2. Преобразовать даты в текстовый формат (число + месяц прописью)
3. Числа в текст (дни прописью для приказов)

### 3. Генерация PDF
```javascript
import puppeteer from 'puppeteer';

async function generatePDF(html, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
  });
  await browser.close();
}
```

### 4. Подписание документов
После генерации PDF:
1. Отправить PDF на подпись через Sigex Gateway
2. Сохранить подписанную версию в хранилище документов
3. Обновить статус документа в БД

## Важные замечания

1. **Двуязычность**: Приказы содержат казахский и русский языки. При генерации оба блока должны быть заполнены.
2. **Подписи**: В HTML-шаблонах подписи отображаются как линии. После подписания ЭЦП линии заменяются на изображения подписей или штампы.
3. **Пустые значения**: Если переменная может быть пустой, рекомендуется скрывать соответствующий блок или выводить прочерк.
4. **Валидация**: Перед генерацией необходимо проверить наличие всех обязательных переменных.
