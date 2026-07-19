const { Client } = require('pg');

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

const configs = [
  { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: 'localhost', port: 54322, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: 'localhost', port: 54322, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
];

async function main() {
  for (const config of configs) {
    console.log(`Trying config: ${config.host}:${config.port} with user ${config.user}`);
    const client = new Client(config);
    try {
      await client.connect();
      console.log(`Connected to ${config.host}:${config.port}!`);
      await client.query(sql);
      console.log("✅ SQL Migration successfully executed!");
      await client.end();
      return;
    } catch (err) {
      console.error(`Error for ${config.host}:${config.port}:`, err.message);
      try {
        await client.end();
      } catch (e) {}
    }
  }
  console.log("❌ All direct pg connections failed.");
}

main();
