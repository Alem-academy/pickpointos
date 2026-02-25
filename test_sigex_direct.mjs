import fetch from 'node-fetch';

const SIGEX_API_URL = 'https://sigex.kz/api';

async function request(endpoint, options = {}) {
    const url = `${SIGEX_API_URL}${endpoint}`;
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed: ${response.statusText}`);
    }
    return data;
}

async function run() {
    try {
        console.log("1. Registering CMS_SIGN_ONLY QR directly to SIGEX...");
        const base64Nonce = Buffer.from("Test Hash 123456").toString('base64');
        const body = {
            description: 'Direct Test',
            signMethod: 'CMS_SIGN_ONLY',
            data: base64Nonce
        };
        const qrRes = await request('/egovQr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const signURL = qrRes.signURL || '';
        const operationId = signURL.substring(signURL.lastIndexOf('/') + 1);
        console.log("QR Registered, Op Id:", operationId);

        console.log("2. Setting timeout for 10 seconds...");
        setTimeout(() => {
            console.log("TIMEOUT HIT, HANG DETECTED.");
            process.exit(1);
        }, 10000);

        console.log("3. Sending Data directly to SIGEX...");
        const dataBody = { data: base64Nonce, signMethod: 'CMS_SIGN_ONLY' };
        const dataRes = await request(`/egovQr/${operationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataBody)
        });
        console.log("Data Sent", dataRes);
        process.exit(0);
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
        process.exit(1);
    }
}
run();
