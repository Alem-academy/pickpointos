import fetch from 'node-fetch';

const API_URL = 'https://gateway.pvz.kz';

async function request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed: ${response.statusText}`);
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
        const base64Nonce = Buffer.from(nonce).toString('base64');
        const body = {
            description: 'Авторизация в PickPoint',
            signMethod: 'CMS_SIGN_ONLY',
            data: base64Nonce
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
        const dataBody = { data: base64Nonce, signMethod: 'CMS_SIGN_ONLY' };
        const dataRes = await request(`/api/sign/egovQr/${operationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataBody)
        });
        console.log("Data Sent", dataRes);

    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
    }
}
run();
