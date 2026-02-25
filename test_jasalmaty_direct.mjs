import fetch from 'node-fetch';

const SIGEX_API_URL = 'https://sigex.kz/api';

async function request(endpoint, options = {}) {
    const url = `${SIGEX_API_URL}${endpoint}`;
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText} ${JSON.stringify(data)}`);
    }
    return data;
}

async function run() {
    try {
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
        const qrRes = await request('/egovQr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const signURL = qrRes.signURL || '';
        const operationId = signURL.substring(signURL.lastIndexOf('/') + 1);
        console.log("QR Registered, Op Id:", operationId);

        console.log("3. Send Data...");
        const dataBody = { data: Buffer.from("test").toString('base64'), signMethod: 'CMS_SIGN_ONLY', documentId: 1 };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const dataRes = await fetch(`${SIGEX_API_URL}/egovQr/${operationId}`, {
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
