process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';

const keys = {
  anon: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw',
  service_role: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MjYzMTUwMCwiZXhwIjo0OTM4MzA1MTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.EFkBbZ-ffCf9mWSvHEHDcqPoBeNCre5huPX0viJqL-g',
  none: null
};

const paths = [
  '/pg-meta/v1/query',
  '/studio/api/projects/default/run-sql',
  '/api/projects/default/query',
  '/api/projects/default/run-sql'
];

async function test(path, keyName, keyVal) {
  const url = `${supabaseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (keyVal) {
    headers['apikey'] = keyVal;
    headers['Authorization'] = `Bearer ${keyVal}`;
  }
  
  console.log(`Testing PATH: ${path} | KEY: ${keyName}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query: 'SELECT 1;'
      })
    });
    console.log(`  Result: Status ${res.status}`);
    const text = await res.text();
    console.log(`  Body: ${text.slice(0, 200)}`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}

async function main() {
  for (const path of paths) {
    for (const [keyName, keyVal] of Object.entries(keys)) {
      await test(path, keyName, keyVal);
    }
  }
}

main();
