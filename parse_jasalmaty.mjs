import fs from 'fs';
const data = fs.readFileSync('jasalmaty.js', 'utf8');

const idx = data.indexOf('registerQRSinging');
if (idx !== -1) {
    const start = Math.max(0, idx - 150);
    const end = Math.min(data.length, idx + 1500);
    console.log(data.substring(start, end));
} else {
    console.log("Not found");
}
