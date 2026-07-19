const { Client } = require('pg');

const sql = `
-- 1. Enable RLS on system_configs table
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow select for everyone" ON public.system_configs;
DROP POLICY IF EXISTS "Allow select for all" ON public.system_configs;
DROP POLICY IF EXISTS "Allow public read" ON public.system_configs;
DROP POLICY IF EXISTS "Allow write only for superadmin" ON public.system_configs;
DROP POLICY IF EXISTS "Allow insert and update for everyone" ON public.system_configs;
DROP POLICY IF EXISTS "Allow write for default config" ON public.system_configs;

-- 3. Create SELECT policy (needed by client-side browser to load config)
CREATE POLICY "Allow public read" ON public.system_configs FOR SELECT USING (true);

-- 4. Create WRITE (insert/update) policy. 
-- Since the frontend currently uses the Supabase Anonymous key to perform configuration updates,
-- we allow anon key insert/update, but we restrict it to ensure the id is always 'default' to protect against table pollution.
CREATE POLICY "Allow write for default config" ON public.system_configs 
  FOR ALL
  USING (id = 'default')
  WITH CHECK (id = 'default');
`;

const config = {
  host: '84.234.99.41',
  port: 5432,
  user: 'supabase_admin',
  password: 'Ytu915llXM5OIo9zhaB8cVYc0wq5BNoN',
  database: 'postgres',
  connectionTimeoutMillis: 5000
};

async function main() {
  console.log(`Connecting to: ${config.host}:${config.port} as ${config.user}`);
  const client = new Client(config);
  try {
    await client.connect();
    console.log(`✅ Connected successfully!`);
    await client.query(sql);
    console.log("✅ SQL DDL Migration for system_configs RLS successfully executed under supabase_admin!");
    await client.end();
  } catch (err) {
    console.error(`❌ Error:`, err.message);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

main();
