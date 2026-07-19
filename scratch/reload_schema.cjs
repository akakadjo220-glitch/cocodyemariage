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
    await client.connect();
    console.log("Connected. Sending NOTIFY pgrst, 'reload schema'...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✅ Successfully notified PGRST to reload schema!");
    await client.end();
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

main();
