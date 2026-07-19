const fs = require('fs');

const sql = `
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
`;

async function main() {
  const url = 'http://84.234.99.41:8000/api/projects/default/query';
  console.log(`Sending query to: ${url}`);
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
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
    if (res.ok) {
      console.log("✅ SQL Migration successfully executed!");
    } else {
      console.error("❌ SQL Migration failed.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error connecting to Studio:", err);
    process.exit(1);
  }
}

main();
