export const CONTRACT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; font-size: 13px; color: #000; max-width: 780px; margin: 0 auto; padding: 20px 40px; }
        h1 { text-align: center; font-size: 15px; font-weight: bold; margin: 0 0 4px 0; letter-spacing: 1px; }
        h2 { text-align: center; font-size: 13px; font-weight: normal; margin: 0 0 28px 0; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 28px; font-size: 13px; }
        .preamble { margin-bottom: 20px; }
        .preamble p { text-align: justify; margin: 6px 0; }
        .indent { text-indent: 25px; }
        .section { margin-bottom: 18px; }
        .section-title { font-weight: bold; text-align: center; margin: 18px 0 8px; font-size: 13px; text-transform: uppercase; }
        p { margin: 3px 0 7px; text-align: justify; }
        .sub { margin-left: 20px; }
        hr { border: none; border-top: 1px solid #999; margin: 30px 0; }
        .requisites { width: 100%; border-collapse: collapse; margin-top: 40px; }
        .requisites th { background: #f2f2f2; border: 1px solid #000; padding: 7px 12px; font-size: 12px; text-align: center; }
        .requisites td { border: 1px solid #000; padding: 14px; vertical-align: top; width: 50%; font-size: 12px; }
        .requisites td p { margin: 3px 0; text-align: left; }
        .sign-area { margin-top: 30px; }
        .sign-line { border-top: 1px solid #000; width: 160px; display: inline-block; margin-top: 45px; }
        .sign-label { font-size: 11px; color: #444; }
    </style>
</head>
<body>

    <h1>ТРУДОВОЙ ДОГОВОР № {{contract_number}}</h1>
    <h2>о приёме на работу</h2>

    <div class="meta">
        <span>г. Алматы</span>
        <span>«{{contract_day}}» {{contract_month}} {{contract_year}} года</span>
    </div>

    <div class="preamble">
        <p class="indent">Товарищество с ограниченной ответственностью <strong>«{{employer_name}}»</strong> (БИН: {{employer_bin}}), именуемое в дальнейшем <strong>«Работодатель»</strong>, в лице Директора <strong>{{employer_director}}</strong>, действующего на основании Устава, с одной стороны, и</p>
        <p class="indent">гражданин(ка) Республики Казахстан <strong>{{full_name}}</strong> (ИИН: <strong>{{iin}}</strong>), именуемый(ая) в дальнейшем <strong>«Работник»</strong>, с другой стороны,</p>
        <p class="indent">совместно именуемые «Стороны», руководствуясь Трудовым кодексом Республики Казахстан, заключили настоящий трудовой договор о нижеследующем:</p>
    </div>

    <div class="section">
        <div class="section-title">1. Предмет договора</div>
        <p>1.1. Работодатель принимает Работника на работу в должности <strong>{{position}}</strong>.</p>
        <p>1.2. Место выполнения работы: пункт выдачи заказов по адресу <strong>{{pvz_address}}</strong>.</p>
        <p>1.3. Дата начала работы: <strong>{{start_date}}</strong>.</p>
        <p>1.4. Настоящий договор заключается на <strong>неопределённый срок</strong>.</p>
        <p>1.5. Работнику устанавливается испытательный срок продолжительностью <strong>3 (три) месяца</strong> с даты начала работы.</p>
        <p>1.6. Работник обязуется лично выполнять трудовые обязанности и соблюдать Правила внутреннего трудового распорядка.</p>
    </div>

    <div class="section">
        <div class="section-title">2. Оплата труда</div>
        <p>2.1. Работнику устанавливается должностной оклад в размере <strong>{{base_rate}} тенге</strong> в месяц, до удержания обязательных налогов и платежей в соответствии с законодательством РК.</p>
        <p>2.2. Заработная плата выплачивается в безналичной форме в национальной валюте не реже одного раза в месяц, не позднее 10-го числа месяца, следующего за отработанным.</p>
        <p>2.3. Заработная плата перечисляется на банковский счёт Работника: <strong>IBAN {{iban}}</strong>.</p>
        <p>2.4. Работодатель вправе устанавливать надбавки и премии согласно действующему Положению об оплате труда.</p>
    </div>

    <div class="section">
        <div class="section-title">3. Режим рабочего времени и отдыха</div>
        <p>3.1. Работнику устанавливается сменный режим рабочего времени. Конкретный график сменности устанавливается Работодателем и доводится до сведения Работника не позднее чем за 5 дней.</p>
        <p>3.2. Продолжительность рабочей смены — 9 (девять) часов, включая перерыв для отдыха и питания продолжительностью 1 (один) час.</p>
        <p>3.3. Работнику предоставляется ежегодный оплачиваемый трудовой отпуск — <strong>24 (двадцать четыре) календарных дня</strong>.</p>
        <p>3.4. Очерёдность предоставления отпусков определяется утверждаемым Работодателем ежегодным графиком отпусков.</p>
    </div>

    <div class="section">
        <div class="section-title">4. Права и обязанности сторон</div>
        <p>4.1. <strong>Работодатель обязуется:</strong></p>
        <p class="sub">— обеспечить Работника работой, обусловленной настоящим Договором;</p>
        <p class="sub">— создавать условия труда, отвечающие требованиям охраны труда и безопасности;</p>
        <p class="sub">— своевременно и в полном объёме выплачивать заработную плату;</p>
        <p class="sub">— осуществлять обязательное социальное страхование, пенсионные отчисления и удержание ИПН согласно законодательству РК.</p>
        <p>4.2. <strong>Работник обязуется:</strong></p>
        <p class="sub">— добросовестно исполнять трудовые обязанности в соответствии с должностной инструкцией;</p>
        <p class="sub">— соблюдать трудовую дисциплину и Правила внутреннего трудового распорядка;</p>
        <p class="sub">— бережно относиться к имуществу Работодателя и третьих лиц;</p>
        <p class="sub">— незамедлительно сообщать о ситуациях, угрожающих жизни, здоровью или сохранности имущества;</p>
        <p class="sub">— соблюдать коммерческую тайну и конфиденциальность информации.</p>
    </div>

    <div class="section">
        <div class="section-title">5. Материальная ответственность</div>
        <p>5.1. Работник несёт полную индивидуальную материальную ответственность за сохранность товарно-материальных ценностей, переданных ему для хранения, приёма и выдачи заказов.</p>
        <p>5.2. С Работником заключается Договор о полной индивидуальной материальной ответственности (Приложение № 1), являющийся неотъемлемой частью настоящего Договора.</p>
        <p>5.3. Ущерб, причинённый Работодателю, возмещается в соответствии с Трудовым кодексом РК.</p>
    </div>

    <div class="section">
        <div class="section-title">6. Прекращение договора</div>
        <p>6.1. Договор прекращается по основаниям, предусмотренным Трудовым кодексом РК.</p>
        <p>6.2. Работник вправе расторгнуть Договор, письменно предупредив Работодателя не менее чем за <strong>1 (один) месяц</strong>.</p>
        <p>6.3. В период испытательного срока каждая Сторона вправе расторгнуть Договор, письменно предупредив другую Сторону не позднее чем за <strong>3 (три) рабочих дня</strong>.</p>
    </div>

    <div class="section">
        <div class="section-title">7. Заключительные положения</div>
        <p>7.1. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, — по одному для каждой Стороны.</p>
        <p>7.2. Условия Договора могут быть изменены по письменному соглашению Сторон.</p>
        <p>7.3. По всем вопросам, не урегулированным настоящим Договором, Стороны руководствуются законодательством РК.</p>
        <p>7.4. Неотъемлемыми частями Договора являются: Приложение № 1 — Договор о полной индивидуальной материальной ответственности; Приложение № 2 — Договор о коллективной (солидарной) ответственности.</p>
        <p>7.5. Работник подтверждает, что до подписания Договора ознакомлен(а) с Правилами внутреннего трудового распорядка, должностной инструкцией и иными локальными актами Работодателя.</p>
    </div>

    <hr>

    <table class="requisites">
        <tr>
            <th>РАБОТОДАТЕЛЬ</th>
            <th>РАБОТНИК</th>
        </tr>
        <tr>
            <td>
                <p><strong>ТОО «{{employer_name}}»</strong></p>
                <p>БИН: {{employer_bin}}</p>
                <p>Юридический адрес: {{employer_address}}</p>
                <p>Банк: {{employer_bank}}</p>
                <p>IBAN: {{employer_iban}}</p>
                <div class="sign-area">
                    <p style="margin-top:8px">Директор &nbsp;<div class="sign-line"></div></p>
                    <p class="sign-label">(подпись) &nbsp;&nbsp;&nbsp;&nbsp; {{employer_director}}</p>
                    <p style="margin-top:10px">М.П.</p>
                </div>
            </td>
            <td>
                <p><strong>{{full_name}}</strong></p>
                <p>ИИН: {{iin}}</p>
                <p>Уд. личности: {{id_number}}</p>
                <p>Адрес проживания: {{address}}</p>
                <p>IBAN: {{iban}}</p>
                <div class="sign-area">
                    <p style="margin-top:8px">Работник &nbsp;<div class="sign-line"></div></p>
                    <p class="sign-label">(подпись) &nbsp;&nbsp;&nbsp;&nbsp; {{full_name}}</p>
                    <p style="margin-top:10px">«{{contract_day}}» {{contract_month}} {{contract_year}} г.</p>
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
    <h2 class="center" style="font-size: 14px; margin-bottom: 30px; font-weight: normal;">О приеме на работу</h2>
    
    <div class="section">
        <p>В соответствии с Трудовым договором № {{contract_number}} от «{{date}}» года,</p>
        
        <p class="bold center" style="margin: 30px 0; font-size: 16px;">ПРИКАЗЫВАЮ:</p>
        
        <p>1. Принять <strong>{{full_name}}</strong> (ИИН {{iin}}) на работу в ТОО «AlemLab PickPoint».</p>
        <p>2. Назначить на должность: <strong>{{position}}</strong>.</p>
        <p>3. Определить место работы: структурное подразделение (ПВЗ) по адресу <strong>{{pvz_address}}</strong>.</p>
        <p>4. Установить дату начала работы: <strong>{{start_date}}</strong>.</p>
        <p>5. Установить должностной оклад в размере <strong>{{base_rate}} тенге</strong> в месяц, до удержания налогов.</p>
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
        const placeholder = '{{' + key + '}}';
        const value = data[key] || '__________';
        content = content.split(placeholder).join(value);
    }
    return content;
}
