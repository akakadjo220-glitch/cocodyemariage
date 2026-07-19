const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/rest/v1/';
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

async function main() {
  console.log("Fetching API schema...");
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const schema = await res.json();
    console.log("Available paths:");
    console.log(Object.keys(schema.paths));
    console.log("Available definitions:");
    console.log(Object.keys(schema.definitions || {}));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
