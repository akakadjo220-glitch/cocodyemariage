-- -------------------------------------------------------------
-- COMPLETE E-MARIAGE SUPABASE SCHEMA INITIALIZATION
-- -------------------------------------------------------------

-- Drop existing tables to recreate them with the correct columns
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.system_configs CASCADE;
DROP TABLE IF EXISTS public.oppositions CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.timeline_steps CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.dossiers CASCADE;
DROP TABLE IF EXISTS public.mairies CASCADE;

-- 1. Mairies Table
CREATE TABLE public.mairies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    access_code TEXT NOT NULL DEFAULT 'COCODY2026',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Dossiers Table
CREATE TABLE public.dossiers (
    id TEXT PRIMARY KEY,
    mairie_id TEXT REFERENCES public.mairies(id) ON DELETE SET NULL,
    spouse1_name TEXT NOT NULL,
    spouse2_name TEXT NOT NULL,
    spouse1_phone TEXT,
    spouse2_phone TEXT,
    spouse1_email TEXT,
    spouse2_email TEXT,
    spouse1_birthdate TEXT,
    spouse2_birthdate TEXT,
    spouse1_cni TEXT,
    spouse2_cni TEXT,
    wedding_date TEXT,
    appointment_date TEXT,
    status TEXT CHECK (status IN ('under_review', 'approved', 'rejected', 'celebrated')) DEFAULT 'under_review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Partners Table
CREATE TABLE public.partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    rating NUMERIC DEFAULT 0,
    contacted BOOLEAN DEFAULT false,
    mairie_id TEXT REFERENCES public.mairies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Documents Table
CREATE TABLE public.documents (
    id TEXT PRIMARY KEY,
    dossier_id TEXT REFERENCES public.dossiers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'uploading', 'verified', 'rejected')) DEFAULT 'pending',
    file_name TEXT,
    category TEXT CHECK (category IN ('spouses', 'witnesses', 'special')) NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Timeline Steps Table
CREATE TABLE public.timeline_steps (
    id INTEGER,
    dossier_id TEXT REFERENCES public.dossiers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('completed', 'active', 'upcoming')) DEFAULT 'upcoming',
    action_label TEXT,
    icon TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id, dossier_id)
);

-- 6. Notifications Table
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    dossier_id TEXT REFERENCES public.dossiers(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'success')) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Oppositions Table
CREATE TABLE public.oppositions (
    id TEXT PRIMARY KEY,
    dossier_id TEXT REFERENCES public.dossiers(id) ON DELETE CASCADE,
    opposer_name TEXT NOT NULL,
    opposer_role TEXT NOT NULL,
    opposer_phone TEXT,
    reason TEXT NOT NULL,
    details TEXT,
    file_name TEXT,
    status TEXT CHECK (status IN ('pending', 'validated', 'dismissed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Payments Table (Financial data)
CREATE TABLE public.payments (
    id TEXT PRIMARY KEY,
    dossier_id TEXT REFERENCES public.dossiers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
    reference TEXT NOT NULL,
    method TEXT NOT NULL,
    date TEXT NOT NULL,
    mairie_id TEXT REFERENCES public.mairies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. System Configs Table (AI configurations)
CREATE TABLE public.system_configs (
    id TEXT PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) on all tables for public access (simulating prototype state)
ALTER TABLE public.mairies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.oppositions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Insert Initial Mairies (Aligned with INITIAL_MAIRIES in dbService.ts)
INSERT INTO public.mairies (id, name, region, access_code, is_active)
VALUES
('cocody_salle_prestige', 'Hôtel de Ville — Salle Prestige (Salle 1)', 'Mairie Principale (Cocody)', 'COCODY2026', true),
('cocody_salle_union', 'Hôtel de Ville — Salle de l''Union (Salle 2)', 'Mairie Principale (Cocody)', 'COCODY2026', true),
('cocody_salle_annexe', 'Mairie Annexe — Salle des Célébrations', 'Mairie Annexe (Angré)', 'COCODY2026', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Partners
INSERT INTO public.partners (id, name, category, description, image_url, rating, contacted)
VALUES 
('p1', 'Studio Lumière Douce', 'Photographes', 'Capturons l''essence de votre amour à travers des clichés intemporels et élégants. Spécialistes des mariages de luxe et cérémonies civiles.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNtn6gGFcpGVeosFMFoECNVxRfdQaykdl7MeyPqI3f6-yLSIjjf2XoNcGKBGraUbGXYxPAk-WnpI1TTGTr3u4yD4M-D-OBLA3IboFJ6QHfWhn0eG1tDpO934theuirsQHG47KsBd-HhsuDtfi33SpP3ybn-FJrajdrARXMtXPPxOPfiqNTmcqAc359id4ZhZk8sNzTFueM63-QslayHS1P_BydQwwGPzcu5cWUmpDZFSFbOUqWr82KaD9eyphlpffSqlyz3vODstg', 4.9, false),
('p2', 'Féerie Florale & Co', 'Décoration', 'Création d''ambiances florales majestueuses sur-mesure. Transformez les salons d''honneur de la mairie ou votre salle de réception en un lieu magique.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBA4PNFpW7EZ2llC-HGlHyv6dFCz_t34qhUkXB8-b83ZSTgq63nB7Qw2Ot5nWttHie3pnK-YFZc0TkESFZHHNveKGr0P8n6SuPox4aT7Ik4-q3tnbrUDoymThPpfI_yJtxDTHbOlpuTUNvrqB6uInZ-JMWaWg0zYY-UjcSb_law6KnR6p6PwNc8h7n5EC1dOGDPdReNtI8gQGqegY1VweCvxA72pojcI9fCkz9E8F1dewPbeqrtQJpaxQi82Q_2KsUcrnNPWl0WnY', 4.8, false),
('p3', 'Maison Blanche Couture', 'Robes & Tenues', 'Robes de mariée haute couture et costumes de cérémonie d''exception sur-mesure. Essayages privés et accompagnement haute couture.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6gsgaDnDghCzuU4W6uAGp1wqyLoH28Fl0foL0eeAbp-pjbknhFIEg4nq5XjhaAjtQFlHL9XtFbBsk10ZKSc6_QRzU7QcLtHaAe6kzuF1U5IbBS-teRGpCgTfNNoNBaoVWGOID17Xvn0qODuTHDs_jQJ848EuNeaOBElK816tPQnWtlxROtfJHXXokbIhORlUfoO7OD6g3Y6i4oFK5bljJNHbkOYCT4dH3rOJBFWiUD9M-4Nx_iPFitVuQ9tTtVsB4Eo5jLzG4PFk', 5.0, false),
('p4', 'Prestige Classic Cars', 'Location de Voitures', 'Arrivez avec distinction. Une collection de véhicules vintages raffinés ou coupés modernes avec chauffeur pour un voyage inoubliable.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDej9l4XLfQJheDqci624P1tQmAUDxuQolbEyj6ff9GlHFs7MHwRq2-_FkYLIt1P4FQ8_CSHqXaso-Udp54xuOaj-XcLyK12_0NOMTP6nSJypBjeKhLXcVX-6121D3pAmDOCmH73GT1wgMyHzgGP8zaXn_Hws5BCXDa7JbYOGPVv-_y21cB3EI9QdyUp1sDVmprsI4tr2up_Tlk2wEbGPGia4a1wHQYeQJHb3QRlcpDKB9dO_5AbZ5wzjXlrBMcxtoAkhBaKEnThkk', 4.7, false)
ON CONFLICT (id) DO NOTHING;
