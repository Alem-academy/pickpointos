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
        const base64Nonce = Buffer.from("Test Hash 123456").toString('base64');
        const qrRes = await request('/egovQr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: 'Direct Test', signMethod: 'CMS_SIGN_ONLY' })
        });
        const operationId = qrRes.signURL.substring(qrRes.signURL.lastIndexOf('/') + 1);
        console.log("QR Registered, Op Id:", operationId);

        console.log("3. Sending Data directly to SIGEX without signMethod...");
        // maybe it only expects { data: '...' } ?
        const dataRes = await request(`/egovQr/${operationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64Nonce })
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
