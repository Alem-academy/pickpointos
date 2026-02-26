import fs from 'fs';
const data = fs.readFileSync('jasalmaty_correct.js', 'utf8');

const idx = data.indexOf('getSignatures');
if (idx !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(data.length, idx + 1500);
    console.log(data.substring(start, end));
} else {
    console.log("Not found");
}
