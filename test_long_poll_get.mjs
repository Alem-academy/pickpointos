import fetch from 'node-fetch';

async function run() {
    try {
        console.log("1. Registering new QR...");
        const bd = {
            description: "Авторизация",
            signMethod: "CMS_SIGN_ONLY",
        };
        const r1 = await fetch('https://sigex.kz/api/egovQr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bd)
        });
        const r1j = await r1.json();
        const opId = r1j.signURL.split('/').pop();
        console.log("Registered OpId:", opId);

        console.log("2. Firing GET signURL to wait for signature...");
        const t0 = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
            const r2 = await fetch(r1j.signURL, { signal: controller.signal });
            clearTimeout(timeoutId);
            console.log("Status:", r2.status, "Time:", Date.now() - t0, "ms");
            const r2text = await r2.text();
            console.log("Body:", r2text);
        } catch (e) {
            console.error("GET failed or hung:", e.message);
        }
    } catch (e) { console.error(e); }
}
run();
