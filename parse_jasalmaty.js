const fs = require('fs');
const data = fs.readFileSync('jasalmaty.js', 'utf8');

// Use a simple regex to find the word 'registerQRSinging' and print context around it
const idx = data.indexOf('registerQRSinging');
if (idx !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(data.length, idx + 800);
    console.log(data.substring(start, end));
} else {
    console.log("Not found");
}
