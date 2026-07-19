const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\99ab6729-a1ab-42e3-8b73-942c9bec8a44\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (line.toLowerCase().includes('partner_contacts') && (line.includes('execute') || line.includes('run') || line.includes('Status') || line.includes('success'))) {
      console.log(`[Line ${lineNum}]: ${line.slice(0, 300)}...`);
    }
  }
}

main();
