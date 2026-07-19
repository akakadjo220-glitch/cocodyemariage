const fs = require('fs');
const readline = require('readline');

async function run() {
  const filePath = 'C:/Users/USER/.gemini/antigravity-ide/brain/5ad43fe6-c5f3-4427-8f9e-5a12e177c855/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Reading lines 2240 to 2260...");
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum >= 2240 && lineNum <= 2260) {
      console.log(`\nLine ${lineNum}:`);
      console.log(line);
    }
  }
}

run();
