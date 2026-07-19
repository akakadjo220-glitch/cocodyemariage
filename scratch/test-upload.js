import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  console.log("Starting test upload...");
  try {
    const fileContent = 'Hello World from Antigravity AI agent!';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    
    console.log("Uploading file to 'documents' bucket...");
    const { data, error } = await supabase.storage
      .from('documents')
      .upload('test/hello.txt', blob, {
        contentType: 'text/plain',
        upsert: true
      });

    if (error) {
      console.error("Upload failed:", error);
    } else {
      console.log("Upload succeeded! Data:", data);
      
      console.log("Getting public URL...");
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl('test/hello.txt');
      
      console.log("Public URL:", publicUrlData.publicUrl);
    }
  } catch (err) {
    console.error("Error during execution:", err);
  }
}

testUpload();
