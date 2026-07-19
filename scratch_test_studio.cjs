async function test(url) {
  console.log(`Testing query endpoint: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT 1;'
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.slice(0, 500)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

async function main() {
  const domains = [
    'supabasestudio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
    'supabase-studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
    'studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io'
  ];

  for (const domain of domains) {
    await test(`http://${domain}/api/projects/default/query`);
    await test(`https://${domain}/api/projects/default/query`);
  }
}

main();
