const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Fetching one row from dossiers...");
  const { data, error } = await supabase
    .from('dossiers')
    .select('*')
    .limit(1);

  if (error) {
    console.error("❌ Error fetching from dossiers:", error.message);
  } else if (data && data.length > 0) {
    console.log("✅ Dossier row keys:", Object.keys(data[0]));
    console.log("Dossier row data:", data[0]);
  } else {
    console.log("✅ Dossiers table is empty, but table exists.");
    // Try to insert a dummy row to see what columns are validated
    const { data: insertData, error: insertError } = await supabase
      .from('dossiers')
      .insert([{
        id: 'dummy-test-id-' + Date.now(),
        spouse1_name: 'Test',
        spouse2_name: 'Test'
      }])
      .select();
      
    if (insertError) {
      console.error("❌ Insert failed:", insertError.message);
    } else {
      console.log("✅ Inserted dummy row keys:", Object.keys(insertData[0]));
      // Clean it up
      await supabase.from('dossiers').delete().eq('id', insertData[0].id);
    }
  }
}

main();
