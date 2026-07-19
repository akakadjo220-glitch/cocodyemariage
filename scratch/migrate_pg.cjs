const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '..', 'update_schema.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

const configs = [
  { host: 'localhost', port: 54322, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: 'localhost', port: 54322, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: '84.234.99.41', port: 6543, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: '84.234.99.41', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
  { host: 'localhost', port: 5432, user: 'postgres', password: 'your-super-secret-and-long-postgres-password', database: 'postgres' },
  { host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
];

async function main() {
  console.log(`Loading SQL from: ${sqlFilePath}`);
  for (const config of configs) {
    console.log(`Connecting to: ${config.host}:${config.port}`);
    const client = new Client({ ...config, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log(`✅ Connected to ${config.host}:${config.port}! Running queries...`);
      await client.query(sql);
      console.log("✅ SQL Migration successfully executed via PG!");
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error(`❌ Error for ${config.host}:${config.port}:`, err.message);
      try { await client.end(); } catch (e) {}
    }
  }
  console.error("All configurations failed to connect and run migrations.");
  process.exit(1);
}

main();
