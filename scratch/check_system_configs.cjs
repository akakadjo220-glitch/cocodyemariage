const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM5NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Fetching system_configs...");
  const { data, error } = await supabase
    .from('system_configs')
    .select('*');

  if (error) {
    console.error("❌ Error fetching system_configs:", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ system_configs contents:", data);
  }
}

main();
