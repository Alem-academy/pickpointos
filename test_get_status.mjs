import fetch from 'node-fetch';

async function run() {
    try {
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
        console.log("QR:", r1j.signURL);
        const opId = r1j.signURL.split('/').pop();

        console.log("Fetching signURL...");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const t0 = Date.now();
            const r2 = await fetch(r1j.signURL, { signal: controller.signal });
            clearTimeout(timeout);
            console.log("Status:", r2.status, "Time:", Date.now() - t0, "ms");
            const r2text = await r2.text();
            console.log("Body:", r2text);
        } catch (e) {
            console.log("HUNG or FAILED:", e.message);
        }
    } catch (e) { console.error(e); }
}
run();
