const fs = require('fs');
const readline = require('readline');

async function run() {
  const filePath = 'C:/Users/USER/.gemini/antigravity-ide/brain/5ad43fe6-c5f3-4427-8f9e-5a12e177c855/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching transcript_full.jsonl for 84.234.99.41...");
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    const idx = line.indexOf("84.234.99.41");
    if (idx !== -1) {
      console.log(`\nLine ${lineNum}:`);
      console.log(line.slice(Math.max(0, idx - 100), idx + 200));
    }
  }
  console.log("\nDone searching.");
}

run();
