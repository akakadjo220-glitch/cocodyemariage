const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'components', 'Timeline.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');

for (let i = 2250; i < 2280; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
