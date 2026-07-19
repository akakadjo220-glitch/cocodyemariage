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
DROP TABLE IF EXISTS public.system_configs CASCADE;

CREATE TABLE public.system_configs (
    id TEXT PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_configs DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.system_configs TO anon, authenticated, service_role, postgres;

INSERT INTO public.system_configs (id, config)
VALUES ('default', '{
  "frais_reservation_montant": 2500,
  "frais_timbre_montant": 100000,
  "rdv_delai_defaut": 15,
  "nombre_reprogrammations_limite": 3,
  "remboursement_absence": false
}'::jsonb);
`;

async function main() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log("Connected to database. Recreating system_configs table...");
    await client.query(sql);
    console.log("Recreated table. Notifying PGRST to reload schema...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✅ Successfully recreated and reloaded!");
    await client.end();
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

main();
