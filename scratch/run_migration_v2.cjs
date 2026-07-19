process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const serviceRoleKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MjYzMTUwMCwiZXhwIjo0OTM4MzA1MTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.EFkBbZ-ffCf9mWSvHEHDcqPoBeNCre5huPX0viJqL-g';

const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query';

const sql = `
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

-- Seed initial rooms if not exist
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

-- Disable RLS
ALTER TABLE public.salles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.creneaux_bloques DISABLE ROW LEVEL SECURITY;

-- Alter Dossiers table with reservation and assignment fields
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_montant INTEGER DEFAULT 2500;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_paye BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_date_paiement TIMESTAMP;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_reference TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS recu_qr_code TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS recu_url_pdf TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS date_rendezvous DATE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS heure_rendezvous TIME;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS rendezvous_confirme BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS nombre_reprogrammations INTEGER DEFAULT 0;

-- Functional columns for slot reservations
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS date_mariage DATE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS heure_mariage TIME;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE SET NULL;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'EN_COURS';

-- RPC: Staggered slot generation function
CREATE OR REPLACE FUNCTION public.generer_creneaux_salle(
  date_test DATE,
  salle_id_test UUID
)
RETURNS TABLE (
  heure_debut TIME,
  heure_fin TIME,
  disponible BOOLEAN
)
LANGUAGE plpgsql AS $$
DECLARE
  salle_info RECORD;
  heure_courante TIME;
  heure_fin_creneau TIME;
BEGIN
  SELECT * INTO salle_info
  FROM public.salles WHERE id = salle_id_test;

  heure_courante := salle_info.heure_ouverture
    + (salle_info.decalage_minutes || ' minutes')::INTERVAL;

  WHILE heure_courante < salle_info.heure_fermeture LOOP
    heure_fin_creneau := heure_courante
      + (salle_info.duree_creneau_minutes || ' minutes')::INTERVAL;

    RETURN QUERY SELECT
      heure_courante,
      heure_fin_creneau,
      NOT EXISTS(
        SELECT 1 FROM public.dossiers
        WHERE date_mariage = date_test
        AND heure_mariage = heure_courante
        AND salle_id = salle_id_test
        AND status NOT IN ('rejected')
        AND statut NOT IN ('ANNULE','EXPIRE','REJETE')
      )
      AND NOT EXISTS(
        SELECT 1 FROM public.creneaux_bloques
        WHERE date_creneau = date_test
        AND heure_courante >= heure_debut
        AND heure_courante < heure_fin
        AND (salle_id IS NULL OR salle_id = salle_id_test)
      );

    heure_courante := heure_courante
      + (salle_info.duree_creneau_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$$;

-- RPC: Quota and availability verification function
CREATE OR REPLACE FUNCTION public.verifier_creneau_disponible(
  date_test DATE,
  heure_test TIME,
  salle_id_test UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
  jour_semaine INTEGER;
  salle_info RECORD;
  max_quota INTEGER;
  occupations_aujourdhui INTEGER;
BEGIN
  -- 1. Day of week check (Wednesday to Saturday: 3 to 6)
  jour_semaine := extract(dow from date_test);
  IF jour_semaine < 3 OR jour_semaine > 6 THEN
    RETURN FALSE;
  END IF;

  -- 2. Validate room active
  SELECT * INTO salle_info FROM public.salles WHERE id = salle_id_test;
  IF NOT FOUND OR NOT salle_info.active THEN
    RETURN FALSE;
  END IF;

  -- 3. Check blocked slot
  IF EXISTS (
    SELECT 1 FROM public.creneaux_bloques
    WHERE date_creneau = date_test
    AND heure_test >= heure_debut
    AND heure_test < heure_fin
    AND (salle_id IS NULL OR salle_id = salle_id_test)
  ) THEN
    RETURN FALSE;
  END IF;

  -- 4. Check global daily quota (all rooms combined)
  BEGIN
    SELECT COALESCE((config->>'quota_max_journalier')::INTEGER, 15) INTO max_quota
    FROM public.system_configs
    WHERE id = 'default';
  EXCEPTION WHEN OTHERS THEN
    max_quota := 15;
  END;

  IF max_quota IS NULL THEN
    max_quota := 15;
  END IF;

  SELECT COUNT(*) INTO occupations_aujourdhui
  FROM public.dossiers
  WHERE date_mariage = date_test
  AND status NOT IN ('rejected')
  AND statut NOT IN ('ANNULE','EXPIRE','REJETE');

  IF occupations_aujourdhui >= max_quota THEN
    RETURN FALSE;
  END IF;

  -- 5. Check if room is already taken at this slot
  IF EXISTS (
    SELECT 1 FROM public.dossiers
    WHERE date_mariage = date_test
    AND heure_mariage = heure_test
    AND salle_id = salle_id_test
    AND status NOT IN ('rejected')
    AND statut NOT IN ('ANNULE','EXPIRE','REJETE')
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;
`;

async function main() {
  console.log("Sending query to Kong query endpoint with Service Role Key...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
    if (res.ok) {
      console.log("✅ SQL Migration successfully executed via Service Role Key!");
    } else {
      console.error("❌ SQL Migration failed.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error executing query:", err);
    process.exit(1);
  }
}

main();
