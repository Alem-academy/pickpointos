const fs = require('fs');

const data = fs.readFileSync('jasalmaty.js', 'utf8');
const match = data.match(/class [a-zA-Z0-9_$]+{constructor[^}]+baseUrl[^}]+}async registerQRSinging\(\){[\s\S]*?getSignatures\(\)[\s\S]*?}/g) || 
              data.match(/registerQRSinging\(\){[^{}]*({[^{}]*({[^{}]*}[^{}]*)*}[^{}]*)*}/g) ||
              data.match(/.{0,200}registerQRSinging\(\).{0,500}/g);

console.log(match ? match[0] : "Not found");
