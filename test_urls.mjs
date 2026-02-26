import fetch from 'node-fetch';

async function run() {
    const res = await fetch('https://sigex.kz/api/egovQr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Авторизация' })
    });
    const data = await res.json();
    console.log("QR Response:", JSON.stringify(data, null, 2));
}
run();
