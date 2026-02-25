import axios from 'axios';

async function run() {
    try {
        console.log("Registering Simple QR...");
        const res = await axios.post('https://gateway.pvz.kz/api/sign/egovQr', {
            description: "Test Auth",
            signMethod: "CMS_SIGN_ONLY"
        });
        
        const operationId = res.data.signURL.split('/').pop();
        console.log("Operation ID:", operationId);
        
        const dataStr = Buffer.from("Test Data " + Date.now()).toString('base64');
        console.log("Sending Data to Operation with documentId...");
        try {
            const dataRes = await axios.post(`https://gateway.pvz.kz/api/sign/egovQr/${operationId}`, {
                documentId: 1,
                signMethod: "CMS_SIGN_ONLY",
                data: dataStr
            });
            console.log("Success with documentId:", dataRes.data);
        } catch (e) {
            console.error("Error with documentId:", e.response?.data || e.message);
        }

        console.log("Sending Data to Operation WITHOUT documentId...");
        try {
            const dataRes2 = await axios.post(`https://gateway.pvz.kz/api/sign/egovQr/${operationId}`, {
                signMethod: "CMS_SIGN_ONLY",
                data: dataStr
            });
            console.log("Success WITHOUT documentId:", dataRes2.data);
        } catch (e) {
            console.error("Error WITHOUT documentId:", e.response?.data || e.message);
        }
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}
run();
