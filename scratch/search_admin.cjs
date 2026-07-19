const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'components', 'AdminDashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((line, i) => {
  if (line.includes('loadData =')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
