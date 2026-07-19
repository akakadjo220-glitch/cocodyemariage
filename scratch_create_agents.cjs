const { Client } = require('pg');

const sql = `
CREATE TABLE IF NOT EXISTS public.mairie_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mairie_id TEXT NOT NULL REFERENCES public.mairies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('agent', 'supervisor')) NOT NULL DEFAULT 'agent',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Désactivation de la RLS pour cette table pour correspondre au reste du projet
ALTER TABLE public.mairie_agents DISABLE ROW LEVEL SECURITY;

-- Insertion de comptes de test par défaut
INSERT INTO public.mairie_agents (mairie_id, name, email, password, role)
VALUES 
('cocody_hotel_de_ville', 'Superviseur Cocody', 'superviseur.cocody@mairie.ci', 'SUPERCOCODY2026', 'supervisor'),
('cocody_hotel_de_ville', 'Agent Cocody', 'agent.cocody@mairie.ci', 'AGENTCOCODY2026', 'agent')
ON CONFLICT (email) DO NOTHING;
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
  console.log("Starting DB migration via direct pg client...");
  for (const config of configs) {
    console.log(`Connecting to: ${config.host}:${config.port}`);
    const client = new Client({ ...config, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log(`✅ Connected to ${config.host}:${config.port}! Running queries...`);
      await client.query(sql);
      console.log("✅ SQL Migration successfully executed via PG!");
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error(`❌ Error for ${config.host}:${config.port}:`, err.message);
      try { await client.end(); } catch (e) {}
    }
  }
  console.error("All configurations failed to connect and run migrations.");
  process.exit(1);
}

main();
