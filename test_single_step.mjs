import fetch from 'node-fetch';

async function run() {
    try {
        console.log("1. Sending ONE single request to SIGEX...");
        const text = "Авторизация в PickPoint";
        const base64Data = Buffer.from(unescape(encodeURIComponent(text))).toString('base64');

        const body = {
            description: "Авторизация",
            signMethod: "CMS_SIGN_ONLY",
            data: base64Data // << THIS IS THE SECRET?
        };

        const res = await fetch('https://sigex.kz/api/egovQr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log("Success:", data);

        if (data.qrCode) {
            console.log("QR Generated successfully.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
