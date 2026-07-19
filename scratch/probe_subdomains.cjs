const domains = [
  'supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'supabasestudio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'supabase-studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'supabase-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'db-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'postgres-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io'
];

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  for (const domain of domains) {
    const url = `https://${domain}/`;
    console.log(`Testing: ${url}`);
    try {
      const res = await fetch(url, { method: 'GET' });
      console.log(`  Result: Status ${res.status}`);
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
    }
  }
}

main();
