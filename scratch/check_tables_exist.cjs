const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = ['partner_contacts', 'dossier_notes', 'activity_logs', 'audit_logs'];

async function checkTable(table) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${table} does not exist or has error: ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Table ${table} exists!`);
    }
  } catch (err) {
    console.log(`❌ Table ${table} error: ${err.message}`);
  }
}

async function main() {
  for (const table of tables) {
    await checkTable(table);
  }
}

main();
