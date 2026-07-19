const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/rest/v1/';
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

async function main() {
  try {
    const res = await fetch(url + 'documents?dossier_id=eq.dossier_2026_8946', {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const docs = await res.json();
    console.log("Documents in DB for dossier_2026_8946:");
    console.log(docs.map(d => ({ id: d.id, name: d.name, category: d.category })));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
