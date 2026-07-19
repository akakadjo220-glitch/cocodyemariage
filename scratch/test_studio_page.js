process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const domains = [
  'supabasestudio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'supabase-studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io',
  'studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io'
];

async function main() {
  for (const domain of domains) {
    for (const proto of ['http', 'https']) {
      const url = `${proto}://${domain}/`;
      console.log(`Fetching ${url}...`);
      try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Title: ${text.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title'}`);
        console.log(`Body excerpt: ${text.slice(0, 300)}`);
      } catch (err) {
        console.log(`Error: ${err.message}`);
      }
    }
  }
}

main();
