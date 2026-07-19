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

  // 2. Seed documents with icon
  console.log("Seeding documents...");
  const { error: seedDocsError } = await supabase.from('documents').insert([
    {
      id: `${testId}_doc1`,
      dossier_id: testId,
      name: 'Test Doc 1',
      status: 'pending',
      category: 'spouses',
      icon: 'FileText'
    }
  ]);

  if (seedDocsError) {
    console.error("Error seeding documents:", seedDocsError);
  } else {
    console.log("Documents seeded successfully.");
  }

  // 3. Seed timeline steps
  console.log("Seeding timeline_steps...");
  const { error: seedStepsError } = await supabase.from('timeline_steps').insert([
    {
      id: 1, // timeline_steps id is INTEGER, wait, but wait, usually timeline_steps table key might be public.timeline_steps_pkey which is (dossier_id, id) or something, let's see. Let's try inserting
      dossier_id: testId,
      title: 'Test Step 1',
      description: 'Test Step 1 Description',
      status: 'active',
      icon: 'Heart'
    }
  ]);

  if (seedStepsError) {
    console.error("Error seeding timeline_steps:", seedStepsError);
  } else {
    console.log("Timeline steps seeded successfully.");
  }

  // 4. Seed notifications
  console.log("Seeding notifications...");
  const { error: seedNotifsError } = await supabase.from('notifications').insert([
    {
      id: `${testId}_not1`,
      dossier_id: testId,
      text: 'Test Notification 1',
      time: '12h00',
      type: 'info'
    }
  ]);

  if (seedNotifsError) {
    console.error("Error seeding notifications:", seedNotifsError);
  } else {
    console.log("Notifications seeded successfully.");
  }

  // 5. Seed documents_dossiers
  console.log("Seeding public.documents_dossiers...");
  const { error: seedDocsDossiersError } = await supabase.from('documents_dossiers').insert([
    {
      dossier_id: testId,
      doc_id: 'doc1',
      numero_document: 'NUM123',
      type_document: 'CNI',
      statut: 'pending'
    }
  ]);

  if (seedDocsDossiersError) {
    console.error("Error seeding documents_dossiers:", seedDocsDossiersError);
  } else {
    console.log("Documents dossiers seeded successfully.");
  }

  // 6. Try to delete the dossier
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

  // 7. Clean up if deletion failed
  if (deleteError) {
    console.log("Cleaning up dependent tables manually...");
    
    await supabase.from('documents').delete().eq('dossier_id', testId);
    await supabase.from('timeline_steps').delete().eq('dossier_id', testId);
    await supabase.from('notifications').delete().eq('dossier_id', testId);
    await supabase.from('documents_dossiers').delete().eq('dossier_id', testId);

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
