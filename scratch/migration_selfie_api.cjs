const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query';
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const sql = `
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_cni_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_cni_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_selfie_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_selfie_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_face_match_score FLOAT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_identite_verifiee BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_cni_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_cni_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_selfie_url TEXT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_selfie_valide BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_face_match_score FLOAT;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_identite_verifiee BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epoux_cni_type TEXT DEFAULT 'CNI';
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS epouse_cni_type TEXT DEFAULT 'CNI';
`;

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log("Sending SQL migration to Kong API...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
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
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
