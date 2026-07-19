const fs = require('fs');

const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/rest/v1/';
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log("Fetching OpenAPI schema from PostgREST...");
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log("Exposed Paths/Routines:");
      const paths = Object.keys(data.paths || {});
      console.log(JSON.stringify(paths, null, 2));
    } else {
      console.error("Failed to fetch schema:", await res.text());
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
