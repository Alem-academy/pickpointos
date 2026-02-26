import fetch from 'node-fetch';
async function run() {
    console.log("Fetching live gateway operationId DORaRphG4ATNeLuM...");
    const r = await fetch('https://gateway.pvz.kz/api/sign/egovQr/DORaRphG4ATNeLuM');
    console.log("Status:", r.status);
    const body = await r.json();
    console.log("Body:", JSON.stringify(body, null, 2));
}
run();
