const domains = [
  'supabasestudio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'supabase-studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'localhost:8000'
];

async function main() {
  for (const domain of domains) {
    const url = `http://${domain}/api/projects/default/query`;
    const secUrl = `https://${domain}/api/projects/default/query`;
    
    for (const finalUrl of [url, secUrl]) {
      console.log(`Testing: ${finalUrl}`);
      try {
        const res = await fetch(finalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'SELECT 1;'
          })
        });
        console.log(`Result from ${finalUrl}: Status ${res.status}`);
        if (res.ok) {
          const text = await res.text();
          console.log(`Body: ${text}`);
          console.log(`🎉 Found active endpoint: ${finalUrl}`);
          return;
        }
      } catch (err) {
        console.log(`Failed for ${finalUrl}: ${err.message}`);
      }
    }
  }
}

main();
