import fetch from 'node-fetch';

const SIGEX_GATEWAY_URL = 'https://gateway.pvz.kz';

async function request(endpoint, options = {}) {
    const url = `${SIGEX_GATEWAY_URL}${endpoint}`;
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText} ${JSON.stringify(data)}`);
    }
    return data;
}

async function run() {
    try {
        console.log("1. Get Nonce...");
        const nonceRes = await request('/api/auth/nonce', { method: 'GET' });
        const nonce = nonceRes.nonce;
        console.log("Nonce:", nonce);

        console.log("2. Register QR...");
        const body = {
            description: 'Авторизация в PickPoint',
            signMethod: 'CMS_SIGN_ONLY',
            documentsToSign: [{
                id: 1,
                nameRu: 'Авторизация в PickPoint',
                nameKz: 'Авторизация в PickPoint',
                nameEn: 'Авторизация в PickPoint'
            }]
        };
        const qrRes = await request('/api/sign/egovQr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const signURL = qrRes.signURL || '';
        const operationId = signURL.substring(signURL.lastIndexOf('/') + 1);
        console.log("QR Registered, Op Id:", operationId);

        console.log("3. Send Data...");
        const base64Nonce = Buffer.from(nonce).toString('base64');
        const dataBody = { data: base64Nonce, signMethod: 'CMS_SIGN_ONLY', documentId: 1 };

        // Timeout wrapper
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const dataRes = await fetch(`${SIGEX_GATEWAY_URL}/api/sign/egovQr/${operationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const dataText = await dataRes.text();
            console.log("Data Sent Response:", dataRes.status, dataText);
        } catch (e) {
            console.error("Data Sending Hung or Failed:", e.message);
        }
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
    }
}
run();
