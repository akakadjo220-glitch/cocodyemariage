const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'services', 'dbService.ts');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

console.log('Total lines before:', lines.length);

// Find the line "// ─────────────────────────────────────────────────────────────────────────────"
// after line 5034 (deleteMairieAgent closing brace)
const cutLine = 5035; // 1-indexed → index 5034

const newContent = lines.slice(0, cutLine).join('\n');
fs.writeFileSync(file, newContent, 'utf8');

const newLines = fs.readFileSync(file, 'utf8').split('\n');
console.log('Total lines after:', newLines.length);
console.log('Last 5 lines:');
newLines.slice(-5).forEach((l, i) => console.log(`${newLines.length - 4 + i}: ${l}`));
