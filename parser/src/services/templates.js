export const CONTRACT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 40px; font-size: 14px; color: #000; }
        h1 { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .section { margin-bottom: 25px; text-align: justify; }
        .section-title { font-weight: bold; margin-bottom: 10px; text-align: center; display: block; }
        .bold { font-weight: bold; }
        .requisites-table { width: 100%; border-collapse: collapse; margin-top: 40px; }
        .requisites-table th, .requisites-table td { border: 1px solid black; padding: 10px; vertical-align: top; width: 50%; }
        .signature-line { margin-top: 30px; }
        ul { margin-top: 5px; margin-bottom: 5px; }
    </style>
</head>
<body>
    <h1>ТРУДОВОЙ ДОГОВОР № {{contract_number}}</h1>
    
    <div class="header">
        <div>г. Алматы</div>
        <div>«{{date}}» года</div>
    </div>

    <div class="section">
        <p>
            Товарищество с ограниченной ответственностью <strong>«AlemLab PickPoint»</strong>, именуемое в дальнейшем «Работодатель», 
            в лице Директора, действующего на основании Устава, с одной стороны, и
        </p>
        <p>
            Гражданин(ка) Республики Казахстан <strong>{{full_name}}</strong>, именуемый(ая) в дальнейшем «Работник», 
            с другой стороны, совместно именуемые «Стороны», заключили настоящий Трудовой договор (далее – Договор) о нижеследующем:
        </p>
    </div>

    <div class="section">
        <span class="section-title">1. ПРЕДМЕТ ДОГОВОРА</span>
        <p>1.1. Работодатель предоставляет Работнику работу по должности <strong>{{position}}</strong>, а Работник обязуется лично выполнять эту работу в соответствии с должностной инструкцией.</p>
        <p>1.2. Место выполнения работы: пункт выдачи заказов по адресу <strong>{{pvz_address}}</strong>.</p>
        <p>1.3. Дата начала работы: <strong>{{start_date}}</strong>.</p>
        <p>1.4. Настоящий договор заключается на неопределенный срок. В целях проверки соответствия Работника поручаемой ему работе устанавливается испытательный срок продолжительностью 3 (три) месяца.</p>
    </div>

    <div class="section">
        <span class="section-title">2. РАЗМЕР И ИНЫЕ УСЛОВИЯ ОПЛАТЫ ТРУДА</span>
        <p>2.1. За выполнение трудовых обязанностей Работнику устанавливается должностной оклад в размере <strong>{{base_rate}} тенге</strong> за одну отработанную смену, до удержания налогов и обязательных платежей.</p>
        <p>2.2. Выплата заработной платы производится в денежной форме в национальной валюте Республики Казахстан не реже одного раза в месяц, не позже первой декады месяца, следующего за отработанным.</p>
        <p>2.3. Заработная плата перечисляется на банковский счет Работника (IBAN: <strong>{{iban}}</strong>).</p>
    </div>

    <div class="section">
        <span class="section-title">3. РЕЖИМ РАБОЧЕГО ВРЕМЕНИ И ВРЕМЕНИ ОТДЫХА</span>
        <p>3.1. Работнику устанавливается сменный график работы согласно утвержденному Работодателем графику сменности.</p>
        <p>3.2. Работнику предоставляется ежегодный оплачиваемый трудовой отпуск продолжительностью 24 календарных дня.</p>
    </div>

    <table class="requisites-table">
        <tr>
            <th>РАБОТОДАТЕЛЬ</th>
            <th>РАБОТНИК</th>
        </tr>
        <tr>
            <td>
                <p class="bold">ТОО "AlemLab PickPoint"</p>
                <p>БИН: 123456789012</p>
                <p>Юридический адрес: г. Алматы</p>
                <div class="signature-line">
                    <p>Директор _______________</p>
                </div>
            </td>
            <td>
                <p class="bold">{{full_name}}</p>
                <p>ИИН: {{iin}}</p>
                <p>Адрес: {{address}}</p>
                <p>IBAN: {{iban}}</p>
                <div class="signature-line">
                    <p>Подпись _______________</p>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const HIRING_ORDER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 40px; font-size: 14px; color: #000; }
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
    <h2 class="center" style="font-size: 14px; margin-bottom: 30px; font-weight: normal;">О приеме на работу</h2>
    
    <div class="section">
        <p>В соответствии с Трудовым договором № {{contract_number}} от «{{date}}» года,</p>
        
        <p class="bold center" style="margin: 30px 0; font-size: 16px;">ПРИКАЗЫВАЮ:</p>
        
        <p>1. Принять <strong>{{full_name}}</strong> (ИИН {{iin}}) на работу в ТОО «AlemLab PickPoint».</p>
        <p>2. Назначить на должность: <strong>{{position}}</strong>.</p>
        <p>3. Определить место работы: структурное подразделение (ПВЗ) по адресу <strong>{{pvz_address}}</strong>.</p>
        <p>4. Установить дату начала работы: <strong>{{start_date}}</strong>.</p>
        <p>5. Установить должностной оклад согласно штатному расписанию в размере <strong>{{base_rate}} тенге</strong> за отработанную смену, до удержания налогов.</p>
        <p>6. Установить испытательный срок продолжительностью 3 (три) месяца.</p>
        <p>7. Контроль за исполнением настоящего приказа оставляю за собой.</p>
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

export const EMPLOYMENT_APPLICATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 60px; font-size: 14px; color: #000; }
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
        <p>от гражданина(ки) Республики Казахстан</p>
        <p class="bold">{{full_name}}</p>
        <p>ИИН: {{iin}}</p>
        <p>Моб. тел: {{phone}}</p>
    </div>

    <div class="title">ЗАЯВЛЕНИЕ</div>
    
    <div class="body-text">
        Прошу принять меня на работу в товарищество с ограниченной ответственностью «AlemLab PickPoint» на должность <strong>{{position}}</strong> 
        в пункт выдачи заказов по адресу <strong>{{pvz_address}}</strong>.
    </div>
    <div class="body-text">
        С условиями труда, правилами внутреннего трудового распорядка, должностной инструкцией, 
        а также с условием установления испытательного срока продолжительностью 3 (три) месяца согласен(на).
    </div>

    <div class="signature-block">
        <div>«{{date}}» года</div>
        <div>Подпись: _________________</div>
    </div>
</body>
</html>
`;

export function fillTemplate(template, data) {
    let content = template;
    for (const key in data) {
        content = content.replace(new RegExp(\`\\\\{\\\\{$\{key\}\\\\}\\\\}\`, 'g'), data[key] || '__________');
    }
    return content;
}
