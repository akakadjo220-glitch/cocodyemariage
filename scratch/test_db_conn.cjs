const { Client } = require('pg');

const config = {
  host: '84.234.99.41',
  port: 5432,
  user: 'postgres',
  password: 'Ytu915llXM5OIo9zhaB8cVYc0wq5BNoN',
  database: 'postgres',
  connectionTimeoutMillis: 5000
};

async function main() {
  console.log(`Connecting to database at ${config.host}:${config.port}...`);
  const client = new Client(config);
  try {
    await client.connect();
    console.log("✅ Successfully connected to PostgreSQL!");
    const res = await client.query("SELECT version();");
    console.log("PostgreSQL Version:", res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error("❌ Failed to connect:", err.message);
  }
}

main();
