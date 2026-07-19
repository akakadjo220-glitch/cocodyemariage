process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

-- Insertion de comptes de test par défaut si non existants
INSERT INTO public.mairie_agents (mairie_id, name, email, password, role)
VALUES 
('cocody_salle_prestige', 'Superviseur Cocody', 'superviseur.cocody@mairie.ci', 'SUPERCOCODY2026', 'supervisor'),
('cocody_salle_prestige', 'Agent Cocody', 'agent.cocody@mairie.ci', 'AGENTCOCODY2026', 'agent')
ON CONFLICT (email) DO NOTHING;
`;

const urls = [
  'https://supabasestudio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'https://supabase-studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'https://studio-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query',
  'http://84.234.99.41:8000/api/projects/default/query',
  'http://localhost:8000/api/projects/default/query'
];

async function run() {
  for (const url of urls) {
    console.log(`Trying to execute migration on: ${url}`);
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
      console.log(`Status code: ${res.status}`);
      const text = await res.text();
      console.log(`Response text: ${text.slice(0, 1000)}`);
      if (res.ok) {
        console.log(`🎉 SQL Migration successfully executed on ${url}!`);
        return;
      }
    } catch (err) {
      console.log(`Failed for ${url}: ${err.message}`);
    }
  }
  console.error('All query endpoints failed.');
}

run();
