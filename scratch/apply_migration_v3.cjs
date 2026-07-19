const { Client } = require('pg');

const config = {
  host: '84.234.99.41',
  port: 5432,
  user: 'supabase_admin',
  password: 'Ytu915llXM5OIo9zhaB8cVYc0wq5BNoN',
  database: 'postgres',
  connectionTimeoutMillis: 5000
};

const migrationSql = `
-- Create Salles (Rooms) table
CREATE TABLE IF NOT EXISTS public.salles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  decalage_minutes INTEGER NOT NULL DEFAULT 0,
  duree_creneau_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  heure_ouverture TIME DEFAULT '08:00',
  heure_fermeture TIME DEFAULT '16:30',
  ordre_affichage INTEGER DEFAULT 0
);

-- Seed initial rooms if they don't exist
INSERT INTO public.salles (nom, decalage_minutes, duree_creneau_minutes, ordre_affichage)
VALUES
('Salle 1', 0, 30, 1),
('Salle 2', 15, 30, 2)
ON CONFLICT DO NOTHING;

-- Create Blocked Slots table
CREATE TABLE IF NOT EXISTS public.creneaux_bloques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_creneau DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alter Dossiers table with reservation and assignment fields
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_montant INTEGER DEFAULT 2500;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_paye BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_date_paiement TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_reference TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS recu_qr_code TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS recu_url_pdf TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS date_rendezvous DATE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS heure_rendezvous TIME;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS rendezvous_confirme BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS nombre_reprogrammations INTEGER DEFAULT 0;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS date_mariage DATE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS heure_mariage TIME;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE SET NULL;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'EN_COURS';

-- Enable Realtime/RLS bypass for new tables (like other tables in prototype)
ALTER TABLE public.salles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.creneaux_bloques DISABLE ROW LEVEL SECURITY;
`;

async function main() {
  console.log("Connecting to PG to apply schema changes...");
  const client = new Client(config);
  try {
    await client.connect();
    console.log("Connected. Executing SQL migration...");
    await client.query(migrationSql);
    console.log("✅ SQL migration successfully executed!");
    await client.end();
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

main();
