const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('game.js', 'utf8');

const ids = [];
const idRegex = /id="([^"]+)"/g;
let match;
while ((match = idRegex.exec(html)) !== null) {
    ids.push(match[1]);
}

const getElementIds = [];
const getElementRegex = /getElementById\('([^']+)'\)/g;
let getElementMatch;
while ((getElementMatch = getElementRegex.exec(js)) !== null) {
    getElementIds.push(getElementMatch[1]);
}

const missing = getElementIds.filter(id => !ids.includes(id));

console.log('HTML IDs:', ids);
console.log('JS IDs:', getElementIds);
console.log('Missing in HTML:', missing.length ? missing : 'None');
console.log('All match:', missing.length === 0 ? 'YES ✓' : 'NO ✗');

// Check for duplicate IDs
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
    console.log('Duplicate IDs in HTML:', duplicates);
}
