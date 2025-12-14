
export const CONTRACT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 40px; }
        h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 15px; }
        .bold { font-weight: bold; }
        .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
        .sign-box { border-top: 1px solid black; padding-top: 10px; width: 40%; }
    </style>
</head>
<body>
    <h1>ТРУДОВОЙ ДОГОВОР № {{contract_number}}</h1>
    
    <div class="header">
        <div>г. Алматы</div>
        <div>{{date}}</div>
    </div>

    <div class="section">
        <p>
            Товарищество с ограниченной ответственностью <strong>"AlemLab PickPoint"</strong>, именуемое в дальнейшем "Работодатель", 
            в лице Директора, действующего на основании Устава, с одной стороны, и
        </p>
        <p>
            Гражданин(ка) <strong>{{full_name}}</strong>, ИИН <strong>{{iin}}</strong>, 
            именуемый(ая) в дальнейшем "Работник", с другой стороны, заключили настоящий Трудовой договор о нижеследующем:
        </p>
    </div>

    <div class="section">
        <span class="bold">1. ПРЕДМЕТ ДОГОВОРА</span>
        <p>1.1. Работник принимается на работу на должность: <strong>{{position}}</strong>.</p>
        <p>1.2. Место работы: ПВЗ по адресу <strong>{{pvz_address}}</strong>.</p>
        <p>1.3. Дата начала работы: <strong>{{start_date}}</strong>.</p>
        <p>1.4. Испытательный срок: 3 месяца.</p>
    </div>

    <div class="section">
        <span class="bold">2. УСЛОВИЯ ОПЛАТЫ ТРУДА</span>
        <p>2.1. Работнику устанавливается заработная плата в размере <strong>{{base_rate}}</strong> тенге за смену.</p>
        <p>2.2. Заработная плата выплачивается ежемесячно до 10 числа следующего месяца.</p>
    </div>

    <div class="section">
        <span class="bold">3. РЕЖИМ РАБОЧЕГО ВРЕМЕНИ</span>
        <p>3.1. Режим работы определяется Графиком сменности (2/2 или по согласованию).</p>
    </div>

    <div class="signature-block">
        <div class="sign-box">
            <p class="bold">РАБОТОДАТЕЛЬ:</p>
            <p>ТОО "AlemLab PickPoint"</p>
            <p>БИН 123456789012</p>
            <br>
            <p>_________________ (Подпись)</p>
        </div>
        <div class="sign-box">
            <p class="bold">РАБОТНИК:</p>
            <p>{{full_name}}</p>
            <p>ИИН {{iin}}</p>
            <br>
            <p>_________________ (Подпись)</p>
        </div>
    </div>
</body>
</html>
`;

export const HIRING_ORDER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 40px; }
        h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 15px; }
        .bold { font-weight: bold; }
        .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
        .sign-box { border-top: 1px solid black; padding-top: 10px; width: 40%; }
    </style>
</head>
<body>
    <div class="header">
        <div>ТОО "AlemLab PickPoint"</div>
        <div>г. Алматы</div>
    </div>

    <h1>ПРИКАЗ № {{order_number}}</h1>
    <h2 style="text-align: center; font-size: 16px; margin-bottom: 20px;">О приеме на работу</h2>
    
    <div class="section">
        <p>
            В соответствии с Трудовым договором № {{contract_number}} от {{date}},
        </p>
        <p class="bold" style="text-align: center; margin: 20px 0;">ПРИКАЗЫВАЮ:</p>
        <p>
            1. Принять на работу <strong>{{full_name}}</strong> (ИИН {{iin}}) на должность <strong>{{position}}</strong> 
            в структурное подразделение ПВЗ по адресу {{pvz_address}}.
        </p>
        <p>
            2. Установить дату начала работы: <strong>{{start_date}}</strong>.
        </p>
        <p>
            3. Установить оплату труда согласно штатному расписанию: <strong>{{base_rate}}</strong> тенге за смену.
        </p>
        <p>
            4. Установить испытательный срок: 3 (три) месяца.
        </p>
    </div>

    <div class="signature-block">
        <div class="sign-box">
            <p class="bold">Директор ТОО "AlemLab PickPoint":</p>
            <br>
            <p>_________________ (Подпись)</p>
        </div>
        <div class="sign-box">
            <p class="bold">С приказом ознакомлен(а):</p>
            <p>{{full_name}}</p>
            <br>
            <p>_________________ (Подпись)</p>
        </div>
    </div>
</body>
</html>
`;

export function fillTemplate(template, data) {
    let content = template;
    for (const key in data) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '__________');
    }
    return content;
}
