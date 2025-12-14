import { createClient } from '../lib/connection.js';

const FIRST_NAMES = [
    'Алина', 'Болат', 'Виктория', 'Данияр', 'Елена', 'Жандос', 'Зарина', 'Игорь',
    'Камила', 'Мурат', 'Наталья', 'Олжас', 'Полина', 'Руслан', 'Светлана', 'Тимур',
    'Ульяна', 'Фархад', 'Кристина', 'Арман', 'Диана', 'Ержан', 'София', 'Марат',
    'Юлия', 'Серик', 'Анастасия', 'Кайрат', 'Екатерина', 'Азамат'
];

const LAST_NAMES = [
    'Ахметова', 'Болатов', 'Васильева', 'Данияров', 'Есенова', 'Жандосов', 'Зарипова', 'Иванов',
    'Калиева', 'Муратов', 'Нургалиева', 'Оспанов', 'Петрова', 'Рахимов', 'Садыкова', 'Тулепов',
    'Умарова', 'Файзуллин', 'Хамитова', 'Цой', 'Чернова', 'Шаймерденов', 'Юсупова', 'Яковлев',
    'Ким', 'Пак', 'Ли', 'Смаилов', 'Алиев', 'Идрисов'
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateIIN() {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

function generatePhone() {
    return '+7 (' + (Math.floor(Math.random() * 90) + 700) + ') ' +
        (Math.floor(Math.random() * 900) + 100) + '-' +
        (Math.floor(Math.random() * 90) + 10) + '-' +
        (Math.floor(Math.random() * 90) + 10);
}

async function run() {
    const client = createClient();
    try {
        await client.connect();
        console.log('Fetching PVZ list...');

        const pvzResult = await client.query('SELECT id, name, address FROM pvz_points');
        const pvzs = pvzResult.rows;

        console.log(`Found ${pvzs.length} PVZs. Creating 2 employees for each...`);

        for (const pvz of pvzs) {
            for (let i = 0; i < 2; i++) {
                const firstName = getRandomElement(FIRST_NAMES);
                const lastName = getRandomElement(LAST_NAMES);
                const fullName = `${lastName} ${firstName}`;
                const iin = generateIIN();
                const phone = generatePhone();
                const email = `emp_${iin.slice(0, 6)}_${i + 1}@pickpoint.kz`;
                const address = `г. Алматы, ул. Примерная ${Math.floor(Math.random() * 100)}, кв. ${Math.floor(Math.random() * 50)}`;

                console.log(`Creating ${fullName} for ${pvz.name}...`);

                await client.query(`
                    INSERT INTO employees (
                        iin, full_name, phone, email, role, status, 
                        main_pvz_id, address, base_rate, hired_at, probation_until
                    ) VALUES (
                        $1, $2, $3, $4, 'employee', 'active', 
                        $5, $6, 120000, NOW(), NOW() + INTERVAL '3 months'
                    ) ON CONFLICT (iin) DO NOTHING
                `, [iin, fullName, phone, email, pvz.id, address]);
            }
        }

        console.log('✅ Mock data generation complete!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
