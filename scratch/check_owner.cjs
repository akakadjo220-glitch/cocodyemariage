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
    
    // Check table owner
    const res = await client.query(`
      SELECT schemaname, tablename, tableowner 
      FROM pg_catalog.pg_tables 
      WHERE tablename = 'dossiers';
    `);
    console.log("Table details:", res.rows);
    
    // Check current user and roles
    const resUser = await client.query("SELECT current_user, session_user;");
    console.log("Current user details:", resUser.rows[0]);
    
    await client.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
