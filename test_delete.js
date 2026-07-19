const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  const testId = 'dossier_test_' + Date.now();
  console.log(`Creating dummy dossier with ID: ${testId}`);

  // 1. Create dossier
  const { error: createError } = await supabase
    .from('dossiers')
    .insert({
      id: testId,
      mairie_id: 'cocody_salle_prestige',
      spouse1_name: 'Test Spouse 1',
      spouse2_name: 'Test Spouse 2',
      status: 'under_review'
    });

  if (createError) {
    console.error("Error creating dossier:", createError);
    return;
  }
  console.log("Dossier created successfully.");

  // 2. Seed documents
  console.log("Seeding documents...");
  const { error: seedDocsError } = await supabase.from('documents').insert([
    {
      id: `${testId}_doc1`,
      dossier_id: testId,
      name: 'Test Doc 1',
      status: 'pending',
      category: 'spouses'
    }
  ]);

  if (seedDocsError) {
    console.error("Error seeding documents:", seedDocsError);
  } else {
    console.log("Documents seeded successfully.");
  }

  // 3. Try to delete the dossier
  console.log("Attempting to delete dossier...");
  const { error: deleteError } = await supabase
    .from('dossiers')
    .delete()
    .eq('id', testId);

  if (deleteError) {
    console.error("Error deleting dossier (First Attempt):", deleteError);
  } else {
    console.log("Dossier deleted successfully (First Attempt).");
  }

  // 4. Clean up document if it wasn't cascaded
  if (deleteError) {
    console.log("Attempting to delete dependent document first...");
    const { error: deleteDocError } = await supabase
      .from('documents')
      .delete()
      .eq('dossier_id', testId);
    
    if (deleteDocError) {
      console.error("Error deleting document:", deleteDocError);
    } else {
      console.log("Document deleted successfully.");
    }

    console.log("Attempting to delete dossier again...");
    const { error: deleteError2 } = await supabase
      .from('dossiers')
      .delete()
      .eq('id', testId);

    if (deleteError2) {
      console.error("Error deleting dossier (Second Attempt):", deleteError2);
    } else {
      console.log("Dossier deleted successfully (Second Attempt).");
    }
  }
}

runTest();
