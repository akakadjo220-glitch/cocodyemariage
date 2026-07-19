const { Client } = require('pg');

const config = {
  host: '84.234.99.41',
  port: 5432,
  user: 'supabase_admin',
  password: 'Ytu915llXM5OIo9zhaB8cVYc0wq5BNoN',
  database: 'postgres',
  connectionTimeoutMillis: 5000
};

async function main() {
  const client = new Client(config);
  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    console.log("Connected successfully!");

    console.log("Resetting document status to pending...");
    const sql = `
      UPDATE public.documents 
      SET status = 'pending', file_name = NULL
      WHERE id = 'dossier_2026_8951_doc2';
    `;

    const res = await client.query(sql);
    console.log("Updated rows:", res.rowCount);
    console.log("Document status reset successfully!");

  } catch (err) {
    console.error("PG Connection error:", err);
  } finally {
    await client.end();
  }
}

main();
