process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query';
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const sqlFilePath = path.join(__dirname, '..', 'update_schema.sql');

async function main() {
  console.log(`Loading SQL from: ${sqlFilePath}`);
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log("Sending SQL migration to Kong API...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
    if (res.ok) {
      console.log("✅ Database schema migration executed successfully via Kong Gateway!");
      process.exit(0);
    } else {
      console.error("❌ Database schema migration failed.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error executing query:", err);
    process.exit(1);
  }
}

main();
