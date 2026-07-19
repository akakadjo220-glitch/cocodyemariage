const { Client } = require('pg');

const config = {
  host: '84.234.99.41',
  port: 5432,
  user: 'supabase_admin',
  password: 'Ytu915llXM5OIo9zhaB8cVYc0wq5BNoN',
  database: 'postgres',
  connectionTimeoutMillis: 5000
};

const sql = `
GRANT ALL ON TABLE public.system_configs TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.salles TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.creneaux_bloques TO anon, authenticated, service_role, postgres;
`;

async function main() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log("Connected to database. Granting permissions on tables...");
    await client.query(sql);
    console.log("✅ Successfully granted permissions!");
    await client.end();
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

main();
