const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Checking if 'salles' table exists...");
  const { data: salles, error: errorSalles } = await supabase
    .from('salles')
    .select('*')
    .limit(1);

  if (errorSalles) {
    console.log("❌ Salles table does NOT exist or error:", errorSalles.message);
  } else {
    console.log("✅ Salles table exists! Data:", salles);
  }

  console.log("Checking if 'creneaux_bloques' table exists...");
  const { data: cb, error: errorCb } = await supabase
    .from('creneaux_bloques')
    .select('*')
    .limit(1);

  if (errorCb) {
    console.log("❌ Creneaux_bloques table does NOT exist or error:", errorCb.message);
  } else {
    console.log("✅ Creneaux_bloques table exists! Data:", cb);
  }
}

main();
