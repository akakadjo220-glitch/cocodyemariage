const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query';
const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const sql = `
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
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
