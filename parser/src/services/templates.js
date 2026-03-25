export { CONTRACT_TEMPLATE } from './contract_template.js';

// ============================================
// ПРИКАЗЫ И ЗАЯВЛЕНИЯ (Март 2024 - Актуальные шаблоны)
// ============================================

export const HIRING_ORDER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 40px; font-size: 14px; color: #000; }
        h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 15px; text-align: justify; }
        .bold { font-weight: bold; }
        .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
        .sign-box { border-top: 1px solid black; padding-top: 10px; width: 45%; }
        .center { text-align: center; }
        .kz-text { font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <p class="bold">«{{employer_short_name}}»</p>
            <p>Жеке Кәсіпкер</p>
            <p class="bold">Индивидуальный предприниматель «{{employer_short_name}}»</p>
        </div>
        <div style="text-align: right;">
            <p class="bold">БҰЙРЫҚ</p>
            <p class="bold">ПРИКАЗ</p>
            <p>«{{order_day}}» {{order_month_kz}} {{order_year}} жыл</p>
            <p>№ {{order_number}}</p>
            <p>Алматы қаласы / город Алматы</p>
        </div>
    </div>

    <h1 style="font-size: 16px; margin-top: 30px;">О приеме на работу</h1>

    <div class="section">
        <p>В соответствии со статьей 34 Трудового кодекса Республики Казахстан от 23 ноября 2015 года № 414-V и условиями трудового договора <strong>ПРИКАЗЫВАЮ:</strong></p>
        <p>Принять <strong>{{full_name}}</strong> с «{{start_day}}» {{start_month_kz}} {{start_year}} года в должности менеджера по работе с клиентами с местом работы по адресу <strong>{{pvz_address}}</strong>, с испытательным сроком на три месяца с момента заключения трудового договора и с оплатой труда согласно трудовому договору № {{contract_number}} от {{contract_date}}.</p>
        <p><strong>Основание:</strong> трудовой договор от «{{contract_date}}» № {{contract_number}}.</p>
    </div>

    <div class="signature-block">
        <div class="sign-box">
            <p class="bold">{{employer_name}}</p>
            <p>Директор</p>
            <br>
            <p>_________________ (подпись)</p>
            <p>{{employer_director}}</p>
        </div>
        <div class="sign-box">
            <p class="bold">С приказом ознакомлен(-а):</p>
            <br><br>
            <p>«{{sign_day}}» {{sign_month_kz}} {{sign_year}} г.</p>
            <p>_________________ ({{full_name}})</p>
        </div>
    </div>
</body>
</html>
`;

export const EMPLOYMENT_APPLICATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 60px; font-size: 14px; color: #000; }
        .header-block { margin-left: 50%; width: 50%; margin-bottom: 50px; text-align: left; }
        .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; letter-spacing: 2px; }
        .body-text { margin-bottom: 40px; text-indent: 30px; text-align: justify; }
        .signature-block { display: flex; justify-content: space-between; margin-top: 50px; }
        .bold { font-weight: bold; }
        .address-block { margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header-block">
        <p>Директору {{employer_name}}</p>
        <p class="bold">{{employer_director_dative}}</p>
        <p>от {{full_name}}</p>
        <p>Проживающий по адресу: {{address}}</p>
        <p>Зарегистрированный по адресу: {{registered_address}}</p>
        <p>Тел: {{phone}}</p>
    </div>

    <div class="title">ЗАЯВЛЕНИЕ</div>

    <div class="body-text">
        Прошу Вас принять меня на работу с «{{start_day}}» {{start_month_kz}} {{start_year}} года на должность менеджера по работе с клиентами.
    </div>

    <div class="signature-block">
        <div>{{date}}</div>
        <div>
            <p>подпись</p>
            <p>{{full_name}}</p>
        </div>
    </div>
</body>
</html>
`;

// ============================================
// НОВЫЕ ШАБЛОНЫ (Март 2024)
// ============================================

// Заявление на отпуск
export const VACATION_APPLICATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 60px; font-size: 14px; color: #000; }
        .header-block { margin-left: 50%; width: 50%; margin-bottom: 50px; text-align: left; }
        .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; letter-spacing: 2px; }
        .body-text { margin-bottom: 40px; text-indent: 30px; text-align: justify; }
        .signature-block { display: flex; justify-content: space-between; margin-top: 50px; }
        .bold { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header-block">
        <p>Директору ТОО «AlemLab PickPoint»</p>
        <p>от {{position}}</p>
        <p class="bold">{{full_name}}</p>
        <p>ИИН: {{iin}}</p>
    </div>

    <div class="title">ЗАЯВЛЕНИЕ</div>

    <div class="body-text">
        Прошу предоставить мне ежегодный оплачиваемый трудовой отпуск продолжительностью <strong>{{vacation_days}} календарных дней</strong>
        с «{{vacation_start}}» по «{{vacation_end}}».
    </div>

    <div class="signature-block">
        <div>«{{date}}» года</div>
        <div>Подпись: _________________</div>
    </div>
</body>
</html>
`;

// Приказ на отпуск
export const VACATION_ORDER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 40px; font-size: 14px; color: #000; }
        h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 15px; text-align: justify; }
        .bold { font-weight: bold; }
        .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
        .sign-box { border-top: 1px solid black; padding-top: 10px; width: 45%; }
        .center { text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="bold">ТОО «AlemLab PickPoint»</div>
        <div>г. Алматы</div>
    </div>

    <h1>ПРИКАЗ № {{order_number}}</h1>
    <h2 class="center" style="font-size: 14px; margin-bottom: 30px; font-weight: normal;">О предоставлении отпуска</h2>

    <div class="section">
        <p class="bold center" style="margin: 30px 0; font-size: 16px;">ПРИКАЗЫВАЮ:</p>
        <p>1. Предоставить <strong>{{full_name}}</strong> (ИИН {{iin}}), {{position}}, ежегодный оплачиваемый трудовой отпуск.</p>
        <p>2. Продолжительность отпуска: <strong>{{vacation_days}} календарных дней</strong>.</p>
        <p>3. Период отпуска: с «{{vacation_start}}» по «{{vacation_end}}».</p>
        <p>4. Выплатить отпускные в соответствии с трудовым законодательством Республики Казахстан.</p>
        <p>5. Контроль за исполнением настоящего приказа оставляю за собой.</p>
    </div>

    <div class="signature-block">
        <div class="sign-box">
            <p class="bold">Директор ТОО «AlemLab PickPoint»:</p>
            <br><br>
            <p>_________________ (Подпись)</p>
        </div>
        <div class="sign-box">
            <p class="bold">С приказом ознакомлен(а):</p>
            <p>{{full_name}}</p>
            <br><br>
            <p>_________________ (Подпись)</p>
        </div>
    </div>
</body>
</html>
`;

// Приказ об увольнении
export const TERMINATION_ORDER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 40px; font-size: 14px; color: #000; }
        h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 15px; text-align: justify; }
        .bold { font-weight: bold; }
        .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
        .sign-box { border-top: 1px solid black; padding-top: 10px; width: 45%; }
        .center { text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="bold">ТОО «AlemLab PickPoint»</div>
        <div>г. Алматы</div>
    </div>

    <h1>ПРИКАЗ № {{order_number}}</h1>
    <h2 class="center" style="font-size: 14px; margin-bottom: 30px; font-weight: normal;">О прекращении трудового договора</h2>

    <div class="section">
        <p class="bold center" style="margin: 30px 0; font-size: 16px;">ПРИКАЗЫВАЮ:</p>
        <p>1. Прекратить трудовой договор № {{contract_number}} от «{{contract_date}}» с <strong>{{full_name}}</strong> (ИИН {{iin}}), {{position}}.</p>
        <p>2. Дата увольнения: <strong>{{termination_date}}</strong>.</p>
        <p>3. Основание увольнения: <strong>{{termination_reason}}</strong>.</p>
        <p>4. Произвести полный расчет с работником в соответствии с трудовым законодательством Республики Казахстан.</p>
        <p>5. Выдать трудовую книжку и иные документы, связанные с работой.</p>
        <p>6. Контроль за исполнением настоящего приказа оставляю за собой.</p>
    </div>

    <div class="signature-block">
        <div class="sign-box">
            <p class="bold">Директор ТОО «AlemLab PickPoint»:</p>
            <br><br>
            <p>_________________ (Подпись)</p>
        </div>
        <div class="sign-box">
            <p class="bold">С приказом ознакомлен(а):</p>
            <p>{{full_name}}</p>
            <br><br>
            <p>_________________ (Подпись)</p>
        </div>
    </div>
</body>
</html>
`;

// Справка с места работы
export const EMPLOYMENT_CERTIFICATE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 40px; font-size: 14px; color: #000; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; }
        .content { text-align: justify; margin-bottom: 40px; }
        .footer { margin-top: 60px; }
        .bold { font-weight: bold; }
        .signature-line { border-top: 1px solid black; padding-top: 5px; margin-top: 40px; display: inline-block; min-width: 200px; }
    </style>
</head>
<body>
    <div class="header">
        <p class="bold">ТОО «AlemLab PickPoint»</p>
        <p>г. Алматы</p>
    </div>

    <div class="title">СПРАВКА</div>

    <div class="content">
        <p>Выдана <strong>{{full_name}}</strong> (ИИН {{iin}}) в том, что он(а) действительно работает в ТОО «AlemLab PickPoint» 
        в должности <strong>{{position}}</strong> с «{{start_date}}» года по настоящее время.</p>
        <p>Среднемесячная заработная плата составляет <strong>{{salary}} тенге</strong>.</p>
        <p>Справка выдана по месту требования.</p>
    </div>

    <div class="footer">
        <p>«{{date}}» года</p>
        <br><br>
        <p class="bold">Директор ТОО «AlemLab PickPoint»</p>
        <div class="signature-line">_________________ (Подпись)</div>
    </div>
</body>
</html>
`;

export function fillTemplate(template, data) {
    let content = template;
    for (const key in data) {
        const placeholder = '{{' + key + '}}';
        const value = data[key] || '__________';
        content = content.split(placeholder).join(value);
    }
    return content;
}

export const SIGNATURE_SHEET_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Arial', sans-serif; padding: 40px; font-size: 13px; color: #000; line-height: 1.5; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 20px; font-weight: bold; text-transform: uppercase; }
        .meta { margin-bottom: 30px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        td, th { border: 1px solid #000; padding: 10px; vertical-align: top; }
        .sign-title { font-weight: bold; background-color: #f2f2f2; text-align: center; font-size: 14px; }
        .qr-container { text-align: center; margin-top: 40px; }
        .qr-container img { width: 150px; height: 150px; display: block; margin: 0 auto 10px; }
        .footer-note { font-size: 11px; color: #555; text-align: justify; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
        .success-badge { color: green; font-weight: bold; margin-bottom: 5px; }
    </style>
</head>
<body>
    <h1>ЛИСТ ПОДПИСАНИЯ ЭЛЕКТРОННОГО ДОКУМЕНТА</h1>
    
    <div class="meta">
        <strong>Документ:</strong> {{document_name}}<br>
        <strong>Уникальный идентификатор (UUID):</strong> {{document_uuid}}
    </div>

    <table>
        <tr>
            <td colspan="2" class="sign-title">СТОРОНА 1: РАБОТОДАТЕЛЬ</td>
        </tr>
        <tr>
            <td width="30%"><strong>Наименование / ФИО:</strong></td>
            <td>ТОО / ИП «{{employer_name}}»</td>
        </tr>
        <tr>
            <td><strong>БИН / ИИН:</strong></td>
            <td>{{employer_bin}}</td>
        </tr>
        <tr>
            <td><strong>Результат подписания:</strong></td>
            <td><div class="success-badge">✓ Подписано ЭЦП</div></td>
        </tr>
        <tr>
            <td><strong>Дата и время подписания:</strong></td>
            <td>{{employer_sign_date}}</td>
        </tr>
        <tr>
            <td><strong>Данные сертификата ЭЦП:</strong></td>
            <td>{{employer_cert_info}}</td>
        </tr>
    </table>

    <table>
        <tr>
            <td colspan="2" class="sign-title">СТОРОНА 2: РАБОТНИК</td>
        </tr>
        <tr>
            <td width="30%"><strong>ФИО:</strong></td>
            <td>{{employee_name}}</td>
        </tr>
        <tr>
            <td><strong>ИИН:</strong></td>
            <td>{{employee_iin}}</td>
        </tr>
        <tr>
            <td><strong>Результат подписания:</strong></td>
            <td><div class="success-badge">✓ Подписано ЭЦП (eGov QR)</div></td>
        </tr>
        <tr>
            <td><strong>Дата и время подписания:</strong></td>
            <td>{{employee_sign_date}}</td>
        </tr>
        <tr>
            <td><strong>Данные сертификата ЭЦП:</strong></td>
            <td>{{employee_cert_info}}</td>
        </tr>
    </table>

    <div class="qr-container">
        <img src="{{qr_code_base64}}" alt="QR Code">
        <div>Отсканируйте код для проверки подлинности документа</div>
    </div>

    <div class="footer-note">
        Данный документ согласно пункту 1 статьи 7 ЗРК от 7 января 2003 года «Об электронном документе и электронной цифровой подписи» равнозначен документу на бумажном носителе. 
        Электронная подпись достоверна. Для проверки подлинности отсканируйте QR-код или введите UUID документа на портале проверки ЭЦП.
    </div>
</body>
</html>
`;
