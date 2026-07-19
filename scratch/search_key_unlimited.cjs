const fs = require('fs');
const readline = require('readline');

async function run() {
  const filePath = 'C:/Users/USER/.gemini/antigravity-ide/brain/5ad43fe6-c5f3-4427-8f9e-5a12e177c855/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outPath = 'c:/Users/USER/Documents/E-Mariage/e-mariage/scratch/untruncated_keys.txt';
  const writeStream = fs.createWriteStream(outPath);

  writeStream.write("Searching transcript_full.jsonl for keys...\n");
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (line.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      writeStream.write(`\n--- Match at Line ${lineNum} ---\n`);
      writeStream.write(line + "\n");
    }
  }
  writeStream.end();
  console.log("Search completed. Output written to scratch/untruncated_keys.txt");
}

run();
