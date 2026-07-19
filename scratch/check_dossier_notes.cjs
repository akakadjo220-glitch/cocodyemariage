const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns(tableName) {
  console.log(`Checking columns for ${tableName}...`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`❌ Error fetching ${tableName}:`, error.message);
  } else if (data && data.length > 0) {
    console.log(`✅ ${tableName} keys:`, Object.keys(data[0]));
    console.log(`${tableName} data:`, data[0]);
  } else {
    console.log(`✅ ${tableName} is empty.`);
  }
}

async function main() {
  await checkColumns('dossier_notes');
  await checkColumns('partner_contacts');
}

main();
