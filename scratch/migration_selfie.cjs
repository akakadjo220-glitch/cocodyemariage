const { Client } = require('pg');

const sql = `
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epoux_cni_url TEXT;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epoux_cni_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epoux_selfie_url TEXT;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epoux_selfie_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epoux_face_match_score FLOAT;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epoux_identite_verifiee BOOLEAN DEFAULT FALSE;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epouse_cni_url TEXT;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epouse_cni_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epouse_selfie_url TEXT;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epouse_selfie_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epouse_face_match_score FLOAT;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epouse_identite_verifiee BOOLEAN DEFAULT FALSE;
`;

const urls = [
  'http://84.234.99.41:8000/api/projects/default/query',
  'https://supabasestudio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'https://supabase-studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'https://studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
];

async function main() {
  let success = false;
  for (const url of urls) {
    console.log(`Trying URL: ${url}`);
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
      console.log(`Status for ${url}: ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text.slice(0, 500)}`);
      if (res.ok) {
        console.log(`✅ SUCCESS with ${url}`);
        success = true;
        break;
      }
    } catch (err) {
      console.error(`Error for ${url}:`, err.message);
    }
  }

  if (!success) {
    console.log("Trying direct PG connection...");
    const configs = [
      { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
      { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
      { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'postgres', database: 'postgres' },
      { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
      { host: 'localhost', port: 54322, user: 'postgres', password: 'postgres', database: 'postgres' },
      { host: 'localhost', port: 54322, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
    ];
    for (const config of configs) {
      console.log(`Trying config: ${config.host}:${config.port}`);
      const client = new Client(config);
      try {
        await client.connect();
        await client.query(sql);
        console.log("✅ SUCCESS with PG direct connection!");
        await client.end();
        success = true;
        break;
      } catch (err) {
        console.error(`Error for ${config.host}:${config.port}:`, err.message);
        try { client.end(); } catch (e) {}
      }
    }
  }

  if (!success) {
    console.error("❌ Migration failed completely.");
    process.exit(1);
  }
}

main();
