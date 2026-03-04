import fetch from 'node-fetch';

const SIGEX_URL = 'https://sigex.kz/api';

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
    console.log("1. Getting Auth Nonce...");
    const nonceRes = await fetch(`${SIGEX_URL}/auth`);
    const { nonce } = await nonceRes.json();

    console.log("\n2. Registering QR...");
    const qrRes = await fetch(`${SIGEX_URL}/egovQr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Авторизация в PickPoint' })
    });
    const qrData = await qrRes.json();
    console.log("QR Link:", qrData.eGovMobileLaunchLink);
    
    console.log("\n3. Sending Data (POST)...");
    const base64Nonce = Buffer.from(decodeURIComponent(escape(nonce))).toString('base64');
    fetch(`${SIGEX_URL}/egovQr/${qrData.operationId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            signMethod: 'CMS_SIGN_ONLY',
            documentsToSign: [{
                id: 1,
                nameRu: 'Auth', nameKz: 'Auth', nameEn: 'Auth', meta: [],
                document: { file: { mime: "", data: base64Nonce } }
            }]
        })
    }).then(() => console.log('POST completed'));

    console.log("\n4. Polling Status...");
    for (let i = 0; i < 40; i++) {
        const statRes = await fetch(`${SIGEX_URL}/egovQr/${qrData.operationId}`);
        const statData = await statRes.json();
        console.log(`Poll ${i+1}: status=${statData.status}`);
        if (statData.status === 'done' || statData.status === 'canceled' || statData.documentsToSign) {
            console.log("FINAL DATA:", JSON.stringify(statData, null, 2));
            break;
        }
        await wait(2000);
    }
}
test();
