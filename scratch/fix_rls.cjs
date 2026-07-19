const { Client } = require('pg');

const config = {
  host: '84.234.99.41',
  port: 5432,
  user: 'supabase_admin',
  password: 'Ytu915llXM5OIo9zhaB8cVYc0wq5BNoN',
  database: 'postgres',
  connectionTimeoutMillis: 5000
};

const sql = `
ALTER TABLE public.system_configs DISABLE ROW LEVEL SECURITY;

-- Insert a default config row if it doesn't exist
INSERT INTO public.system_configs (id, config)
VALUES ('default', '{
  "frais_reservation_montant": 2500,
  "frais_timbre_montant": 100000,
  "rdv_delai_defaut": 15,
  "nombre_reprogrammations_limite": 3,
  "remboursement_absence": false
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
`;

async function main() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log("Connected to database. Fixing RLS and seeding system_configs...");
    await client.query(sql);
    console.log("✅ Successfully updated system_configs table!");
    await client.end();
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

main();
