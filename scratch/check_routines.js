const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Fetching routines from the database...");
  try {
    const { data, error } = await supabase
      .from('dossiers')
      .select('id')
      .limit(1);
    if (error) {
      console.error("Test connection failed:", error);
      return;
    }
    console.log("Connection OK.");

    // Query pg_proc via RPC if possible or check if we can query pg_proc table
    // Let's try to query information_schema.routines directly via REST
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/buscar_funciones`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`RPC buscar_funciones status: ${res.status}`);

    // Let's try querying information_schema.routines
    const res2 = await fetch(`${supabaseUrl}/rest/v1/information_schema/routines?select=routine_name`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log(`information_schema.routines status: ${res2.status}`);
    if (res2.ok) {
      const routines = await res2.json();
      console.log("Routines:", routines);
    } else {
      console.log("Routines query failed:", await res2.text());
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
