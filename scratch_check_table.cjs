const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Checking if mairie_agents table exists...");
  try {
    const { data, error } = await supabase
      .from('mairie_agents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log("Error querying table:", error.message);
      console.log("Code:", error.code);
    } else {
      console.log("✅ Table exists! Data:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

main();
