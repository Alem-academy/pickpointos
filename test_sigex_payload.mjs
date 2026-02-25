import fetch from 'node-fetch';

async function run() {
    console.log("Registering");
    const qrRes = await fetch('https://sigex.kz/api/egovQr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Test', signMethod: 'CMS_SIGN_ONLY' })
    }).then(r => r.json());

    const opId = qrRes.signURL.split('/').pop();
    console.log("OpId:", opId);

    console.log("Sending dummyData same as yesterday...");
    const dummyData = Buffer.from(unescape(encodeURIComponent("Текст для подписания в PickPoint"))).toString('base64');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const dataRes = await fetch(`https://sigex.kz/api/egovQr/${opId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: dummyData, signMethod: 'CMS_SIGN_ONLY' }),
            signal: controller.signal
        }).then(r => r.json());
        clearTimeout(timeoutId);

        console.log("Data Sent", dataRes);
    } catch (e) {
        console.error("HUNG/ERRORED:", e.message);
    }
}
run();
