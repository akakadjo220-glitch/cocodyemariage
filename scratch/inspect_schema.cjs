const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Inspecting schema...");
  try {
    // We can query the information_schema via RPC or a raw sql function if one exists,
    // or we can just try to insert invalid values or inspect by trying to fetch from the tables.
    // Let's query information_schema.columns using an RPC or pg_attribute.
    // If there is no custom query runner, we can write a quick query to fetch system catalog.
    
    // Let's run a select on information_schema.columns via pg_class/pg_attribute if we have access,
    // or let's try a query on documents and see its result.
    const { data: cols, error } = await supabase.rpc('run_sql_query', {
      query_text: `
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name IN ('dossiers', 'documents', 'documents_dossiers', 'memoire_documents')
        ORDER BY table_name, ordinal_position;
      `
    });

    if (error) {
      console.warn("RPC run_sql_query failed, trying direct select error inspect...", error);
      // Let's try to query pg_catalog or a custom function
    } else {
      console.log("Schema columns:", cols);
    }
  } catch (err) {
    console.error("Execution error:", err);
  }
}

run();
