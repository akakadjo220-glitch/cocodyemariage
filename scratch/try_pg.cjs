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
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epoux_cni_type TEXT DEFAULT 'CNI';
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS epouse_cni_type TEXT DEFAULT 'CNI';
`;

const configs = [
  { host: 'localhost', port: 54322, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: 'localhost', port: 54322, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: 'localhost', port: 5432, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
];

async function main() {
  for (const config of configs) {
    console.log(`Connecting to: ${config.host}:${config.port}`);
    const client = new Client({ ...config, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log(`✅ Connected to ${config.host}:${config.port}!`);
      const res = await client.query(sql);
      console.log("✅ SQL Migration successfully executed via PG!");
      await client.end();
      return;
    } catch (err) {
      console.error(`❌ Error for ${config.host}:${config.port}:`, err.message);
      try { await client.end(); } catch (e) {}
    }
  }
  console.log("All configurations failed.");
  process.exit(1);
}

main();
