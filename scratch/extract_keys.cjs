const fs = require('fs');
const path = require('path');
const readline = require('readline');

const convIds = [
  '5ad43fe6-c5f3-4427-8f9e-5a12e177c855',
  '8f85c25b-5ada-4000-8400-d806381283a4',
  '087ae223-6555-4e13-af82-504c9dd3abde',
  'e1a90bb6-fe02-491d-9024-6d711ce27a38',
  'd2fa7bda-ba52-41e7-b4cf-aacfa833751a',
  '6f26f724-a818-4fce-851b-a499b302e9f8',
  'f9e430fa-db90-489f-bc37-d41137a9b001'
];

async function scanConv(convId) {
  const filePath = `C:/Users/USER/.gemini/antigravity-ide/brain/${convId}/.system_generated/logs/transcript_full.jsonl`;
  if (!fs.existsSync(filePath)) {
    return;
  }
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (line.includes("service_role") || line.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      const matches = line.match(/eyJ[a-zA-Z0-9_=-]+\.eyJ[a-zA-Z0-9_=-]+\.[a-zA-Z0-9_=-]+/g);
      if (matches) {
        matches.forEach((token) => {
          const payloadPart = token.split('.')[1];
          try {
            const decoded = Buffer.from(payloadPart, 'base64').toString('utf8');
            if (decoded.includes("service_role")) {
              console.log(`\n[Conv: ${convId}] Line ${lineNum}: FOUND KEY!`);
              console.log(`Token: ${token}`);
              console.log(`Length: ${token.length}`);
              console.log(`Decoded: ${decoded}`);
            }
          } catch (e) {
            // ignore
          }
        });
      }
    }
  }
}

async function run() {
  console.log("Scanning recent conversations for service_role keys...");
  for (const id of convIds) {
    await scanConv(id);
  }
  console.log("All scans completed.");
}

run();
