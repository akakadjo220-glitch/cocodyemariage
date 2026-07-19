process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '..', 'update_schema.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

const urls = [
  'https://supabasestudio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'https://supabase-studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'https://studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'http://84.234.99.41:8000/api/projects/default/query',
  'http://localhost:8000/api/projects/default/query'
];

async function tryUrl(url) {
  console.log(`\n---------------------------------------------\nTesting endpoint: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.slice(0, 500)}`);
    if (res.ok) {
      console.log(`✅ Success with URL: ${url}`);
      return true;
    }
  } catch (err) {
    console.error(`Error details:`, err);
  }
  return false;
}

async function main() {
  for (const url of urls) {
    const success = await tryUrl(url);
    if (success) {
      console.log("\nMigration completed successfully!");
      process.exit(0);
    }
  }
  console.error("\n❌ All migration endpoints failed.");
  process.exit(1);
}

main();
