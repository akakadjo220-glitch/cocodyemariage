-- SQL Migration Script
-- Add new contact columns to the dossiers table without dropping data

ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse1_phone TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse2_phone TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse1_email TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse2_email TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse1_birthdate TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse2_birthdate TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse1_cni TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse2_cni TEXT;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Supprimer les anciennes tables si déjà créées
DROP TABLE IF EXISTS memoire_documents CASCADE;
DROP TABLE IF EXISTS patterns_fraude CASCADE;
DROP FUNCTION IF EXISTS chercher_documents_similaires;

-- Recréer avec la bonne dimension 1024
CREATE TABLE IF NOT EXISTS memoire_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_document TEXT,
  commune TEXT,
  annee_document INTEGER,
  decision TEXT,
  score_authenticite INTEGER,
  anomalies_detectees JSONB,
  embedding VECTOR(1024),
  valide_par_agent BOOLEAN DEFAULT FALSE,
  date_analyse TIMESTAMP DEFAULT NOW(),
  dossier_id UUID
);

CREATE INDEX IF NOT EXISTS memoire_embedding_idx
ON memoire_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE TABLE IF NOT EXISTS patterns_fraude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT,
  embedding VECTOR(1024),
  nombre_occurrences INTEGER DEFAULT 1,
  date_detection TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION chercher_documents_similaires(
  vecteur_query VECTOR(1024),
  seuil_similarite FLOAT DEFAULT 0.85,
  limite INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  type_document TEXT,
  commune TEXT,
  decision TEXT,
  score_authenticite INT,
  anomalies_detectees JSONB,
  valide_par_agent BOOLEAN,
  similarite FLOAT
)
LANGUAGE SQL AS $$
  SELECT
    id, type_document, commune,
    decision, score_authenticite,
    anomalies_detectees, valide_par_agent,
    1 - (embedding <=> vecteur_query) AS similarite
  FROM memoire_documents
  WHERE 1 - (embedding <=> vecteur_query) > seuil_similarite
  ORDER BY similarite DESC
  LIMIT limite;
$$;

-- Table for structured document data storage and duplicate checks
-- Colonnes alignées avec le code (upsert on conflict dossier_id, doc_id)
CREATE TABLE IF NOT EXISTS documents_dossiers (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id            UUID    NOT NULL,
  doc_id                TEXT    NOT NULL,           -- identifiant logique du doc (ex: 'doc1', 'doc2_f')
  numero_document       TEXT,                       -- numéro extrait par IA (CNI/Passeport/autre)
  type_document         TEXT,                       -- CNI | PASSEPORT | EXTRAIT_NAISSANCE | ...
  statut                TEXT    DEFAULT 'pending',  -- pending | verified | rejected
  nom_extrait           TEXT,
  prenoms_extraits      TEXT,
  date_naissance_extraite TEXT,
  -- Colonnes optionnelles conservées pour rétro-compatibilité
  appartient_a          TEXT,                       -- 'EPOUX' ou 'EPOUSE'
  decision_ia           TEXT,
  score_authenticite    INTEGER,
  anomalies             JSONB,
  valide_par_agent      BOOLEAN DEFAULT FALSE,
  date_analyse          TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  -- Contrainte d'unicité requise par les upserts ON CONFLICT (dossier_id, doc_id)
  UNIQUE (dossier_id, doc_id)
);

-- Index rapide pour la détection de doublons (étape 2E)
CREATE INDEX IF NOT EXISTS idx_numero_document
ON documents_dossiers(numero_document)
WHERE numero_document IS NOT NULL
  AND statut NOT IN ('ANNULE','EXPIRE','REJETE');

-- Si la table existait déjà sans les nouvelles colonnes, les ajouter sans perte de données
ALTER TABLE documents_dossiers ADD COLUMN IF NOT EXISTS doc_id               TEXT;
ALTER TABLE documents_dossiers ADD COLUMN IF NOT EXISTS nom_extrait          TEXT;
ALTER TABLE documents_dossiers ADD COLUMN IF NOT EXISTS prenoms_extraits     TEXT;
ALTER TABLE documents_dossiers ADD COLUMN IF NOT EXISTS date_naissance_extraite TEXT;
ALTER TABLE documents_dossiers ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP DEFAULT NOW();

-- Mettre à jour memoire_documents pour inclure dossier_id et doc_id avec contrainte unique
ALTER TABLE memoire_documents ADD COLUMN IF NOT EXISTS doc_id TEXT;
ALTER TABLE memoire_documents ADD COLUMN IF NOT EXISTS contenu TEXT;
ALTER TABLE memoire_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Contrainte d'unicité sur memoire_documents pour les upserts ON CONFLICT (dossier_id, doc_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'memoire_documents_dossier_doc_unique'
  ) THEN
    ALTER TABLE memoire_documents
    ADD CONSTRAINT memoire_documents_dossier_doc_unique
    UNIQUE (dossier_id, doc_id);
  END IF;
END $$;

-- Contrainte d'unicité sur documents_dossiers si elle n'existe pas encore
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documents_dossiers_dossier_doc_unique'
  ) THEN
    ALTER TABLE documents_dossiers
    ADD CONSTRAINT documents_dossiers_dossier_doc_unique
    UNIQUE (dossier_id, doc_id);
  END IF;
END $$;

-- Extended schema for E-Mariage production migration (removing localStorage)

-- 1. Add missing columns to dossiers table
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS slot_reserved_at TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS whatsapp_reminders_sent TEXT[];
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS physical_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS bans_published_at TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_cni_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_cni_valide BOOLEAN;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_selfie_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_selfie_valide BOOLEAN;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_face_match_score NUMERIC;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_identite_verifiee BOOLEAN;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_cni_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_cni_valide BOOLEAN;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_selfie_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_selfie_valide BOOLEAN;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_face_match_score NUMERIC;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_identite_verifiee BOOLEAN;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse1_cni_type TEXT DEFAULT 'CNI';
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS spouse2_cni_type TEXT DEFAULT 'CNI';
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_face_attempts INTEGER DEFAULT 0;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_face_attempts INTEGER DEFAULT 0;

-- 2. Create partner_contacts table
CREATE TABLE IF NOT EXISTS public.partner_contacts (
    id TEXT PRIMARY KEY,
    dossier_id TEXT REFERENCES public.dossiers(id) ON DELETE CASCADE,
    partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create dossier_notes table (Internal notes)
CREATE TABLE IF NOT EXISTS public.dossier_notes (
    id TEXT PRIMARY KEY,
    dossier_id TEXT REFERENCES public.dossiers(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'admin')) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) for new tables to match existing setup
ALTER TABLE public.partner_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- 5. Add appointment_date to dossiers (date du rendez-vous physique en mairie)
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS appointment_date TEXT;

-- 6. Add mairie_exam_unlocked column to unlock "Examiner" button for mairie agent
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS mairie_exam_unlocked BOOLEAN DEFAULT FALSE;

-- 7. Real-time validation and anti-duplication
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Index for phone/CNI duplicate checking
CREATE INDEX IF NOT EXISTS idx_spouse1_phone ON public.dossiers(spouse1_phone) WHERE status NOT IN ('rejected');
CREATE INDEX IF NOT EXISTS idx_spouse2_phone ON public.dossiers(spouse2_phone) WHERE status NOT IN ('rejected');
CREATE INDEX IF NOT EXISTS idx_spouse1_cni ON public.dossiers(spouse1_cni) WHERE status NOT IN ('rejected');
CREATE INDEX IF NOT EXISTS idx_spouse2_cni ON public.dossiers(spouse2_cni) WHERE status NOT IN ('rejected');

-- Check duplicate phone function
CREATE OR REPLACE FUNCTION public.verifier_telephone(tel TEXT, exclusion_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE SQL AS $$
  SELECT jsonb_build_object(
    'existe', COUNT(*) > 0,
    'champ', CASE
      WHEN COUNT(*) FILTER (
        WHERE spouse1_phone = tel
      ) > 0 THEN 'spouse1_phone'
      WHEN COUNT(*) FILTER (
        WHERE spouse2_phone = tel
      ) > 0 THEN 'spouse2_phone'
      ELSE NULL
    END
  )
  FROM public.dossiers
  WHERE (
    spouse1_phone = tel
    OR spouse2_phone = tel
  )
  AND status NOT IN ('rejected')
  AND (exclusion_id IS NULL OR id <> exclusion_id);
$$;

-- Check duplicate CNI function
CREATE OR REPLACE FUNCTION public.verifier_numero_piece(numero TEXT, exclusion_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE SQL AS $$
  SELECT jsonb_build_object(
    'existe', COUNT(*) > 0,
    'champ', CASE
      WHEN COUNT(*) FILTER (
        WHERE spouse1_cni = numero
      ) > 0 THEN 'spouse1_cni'
      WHEN COUNT(*) FILTER (
        WHERE spouse2_cni = numero
      ) > 0 THEN 'spouse2_cni'
      ELSE NULL
    END
  )
  FROM public.dossiers
  WHERE (
    spouse1_cni = numero
    OR spouse2_cni = numero
  )
  AND status NOT IN ('rejected')
  AND (exclusion_id IS NULL OR id <> exclusion_id);
$$;

-- 8. Table public.mairie_agents (Séparation des Rôles & Gestion des Agents Cocody)
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
('cocody_salle_prestige', 'Superviseur Cocody', 'superviseur.cocody@mairie.ci', 'SUPERCOCODY2026', 'supervisor'),
('cocody_salle_prestige', 'Agent Cocody', 'agent.cocody@mairie.ci', 'AGENTCOCODY2026', 'agent')
ON CONFLICT (email) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION v2 : Réservation de créneau, salles d'union, paramètres
-- ═══════════════════════════════════════════════════════════════════

-- 9. Colonnes de réservation sur la table dossiers
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_montant         INTEGER DEFAULT 2500;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_paye            BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_date_paiement   TIMESTAMP;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS frais_reservation_reference       TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS recu_qr_code                      TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS recu_url_pdf                      TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS salle_id                          TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS nb_reprogrammations               INTEGER DEFAULT 0;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS nombre_reprogrammations           INTEGER DEFAULT 0;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS date_rendezvous                   TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS heure_rendezvous                  TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS rendezvous_confirme               BOOLEAN DEFAULT FALSE;

-- 10. Table des salles d'union civile
-- NB : nom de table = "salles" (cohérent avec dbService.ts interface Salle)
CREATE TABLE IF NOT EXISTS public.salles (
    id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    nom                   TEXT    NOT NULL,
    decalage_minutes      INTEGER NOT NULL DEFAULT 0,
    -- Salle 1 = 0, Salle 2 = 15, Salle 3 = 30
    duree_creneau_minutes INTEGER NOT NULL DEFAULT 30,
    active                BOOLEAN NOT NULL DEFAULT TRUE,
    heure_ouverture       TIME    NOT NULL DEFAULT '08:00',
    heure_fermeture       TIME    NOT NULL DEFAULT '16:30',
    ordre_affichage       INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.salles DISABLE ROW LEVEL SECURITY;

-- Salles de départ (Cocody)
INSERT INTO public.salles (nom, decalage_minutes, duree_creneau_minutes, heure_ouverture, heure_fermeture, ordre_affichage)
VALUES
  ('Salle 1',  0, 30, '08:00', '16:30', 1),
  ('Salle 2', 15, 30, '08:00', '16:30', 2)
ON CONFLICT DO NOTHING;

-- 11. Table des créneaux bloqués
CREATE TABLE IF NOT EXISTS public.creneaux_bloques (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    salle_id     UUID    REFERENCES public.salles(id) ON DELETE CASCADE,
    date_creneau DATE    NOT NULL,
    heure_debut  TIME    NOT NULL,
    heure_fin    TIME    NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.creneaux_bloques DISABLE ROW LEVEL SECURITY;

-- 12. Paramètres système (1 seule ligne)
CREATE TABLE IF NOT EXISTS public.system_parameters (
    id                              INTEGER PRIMARY KEY DEFAULT 1,
    frais_reservation_montant       INTEGER NOT NULL DEFAULT 2500,
    frais_timbre_montant            INTEGER NOT NULL DEFAULT 100000,
    rdv_delai_defaut                INTEGER NOT NULL DEFAULT 15,
    nombre_reprogrammations_limite  INTEGER NOT NULL DEFAULT 3,
    remboursement_absence           BOOLEAN NOT NULL DEFAULT FALSE,
    quota_max_journalier            INTEGER NOT NULL DEFAULT 15,
    updated_at                      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.system_parameters DISABLE ROW LEVEL SECURITY;

INSERT INTO public.system_parameters
  (id, frais_reservation_montant, frais_timbre_montant, rdv_delai_defaut, nombre_reprogrammations_limite, remboursement_absence, quota_max_journalier)
VALUES (1, 2500, 100000, 15, 3, FALSE, 15)
ON CONFLICT (id) DO NOTHING;

-- 13. Fonction Supabase — Générer les créneaux d'une salle pour une date donnée
-- Utilisée par genererPlanningJour() dans dbService.ts
CREATE OR REPLACE FUNCTION public.generer_creneaux_salle(
  date_test     DATE,
  salle_id_test UUID
)
RETURNS TABLE (
  heure_debut TIME,
  heure_fin   TIME,
  disponible  BOOLEAN
)
LANGUAGE plpgsql AS $$
DECLARE
  salle_info     RECORD;
  heure_courante TIME;
  heure_fin_creneau TIME;
BEGIN
  SELECT * INTO salle_info FROM public.salles WHERE id = salle_id_test;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  heure_courante := salle_info.heure_ouverture
    + (salle_info.decalage_minutes || ' minutes')::INTERVAL;

  WHILE heure_courante < salle_info.heure_fermeture LOOP
    heure_fin_creneau := heure_courante
      + (salle_info.duree_creneau_minutes || ' minutes')::INTERVAL;

    RETURN QUERY SELECT
      heure_courante,
      heure_fin_creneau,
      -- Disponible si :
      -- 1. Non réservé dans dossiers (même date, même heure, même salle)
      NOT EXISTS (
        SELECT 1 FROM public.dossiers d
        WHERE d.date_mariage = date_test::TEXT
          AND d.heure_mariage = heure_courante::TEXT
          AND d.salle_id     = salle_id_test::TEXT
          AND d.statut NOT IN ('ANNULE','EXPIRE','REJETE')
      )
      -- 2. Non bloqué dans creneaux_bloques
      AND NOT EXISTS (
        SELECT 1 FROM public.creneaux_bloques cb
        WHERE cb.date_creneau = date_test
          AND heure_courante >= cb.heure_debut
          AND heure_courante <  cb.heure_fin
          AND (cb.salle_id IS NULL OR cb.salle_id = salle_id_test)
      )
      -- 3. Quota global journalier non atteint
      AND (
        SELECT COUNT(*) FROM public.dossiers q
        WHERE q.date_mariage = date_test::TEXT
          AND q.statut NOT IN ('ANNULE','EXPIRE','REJETE')
      ) < (
        SELECT COALESCE(sp.quota_max_journalier, 15)
        FROM public.system_parameters sp
        LIMIT 1
      );

    heure_courante := heure_courante
      + (salle_info.duree_creneau_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$$;

-- 14. Index sur la référence de réservation pour le scanner QR
CREATE INDEX IF NOT EXISTS idx_frais_reservation_reference
ON public.dossiers(frais_reservation_reference)
WHERE frais_reservation_reference IS NOT NULL;

-- 15. Index sur salle_id pour les calculs de planning
CREATE INDEX IF NOT EXISTS idx_dossiers_salle_date
ON public.dossiers(salle_id, date_mariage)
WHERE statut NOT IN ('ANNULE','EXPIRE','REJETE');


-- 16. Sécurisation de la table system_configs (Row Level Security)
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.system_configs;
DROP POLICY IF EXISTS "Allow write for default config" ON public.system_configs;

CREATE POLICY "Allow public read" ON public.system_configs FOR SELECT USING (true);
CREATE POLICY "Allow write for default config" ON public.system_configs 
  FOR ALL
  USING (id = 'default')
  WITH CHECK (id = 'default');
