// Set up global mocks for browser APIs before importing dbService
const storage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { for (const key in storage) delete storage[key]; },
  length: 0,
  key: (index: number) => Object.keys(storage)[index] || null
};
(global as any).window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

async function runTest() {
  console.log("Starting duplicate prevention test...");

  // Dynamic import dbService so that global mocks are set up first
  const { createDossier, updateDocumentInDb, checkDuplicateDocumentNumber, deleteDossier } = await import('../src/services/dbService');
  
  const testDossierAId = 'dossier_test_a_' + Math.random().toString(36).substring(7);
  const testDossierBId = 'dossier_test_b_' + Math.random().toString(36).substring(7);
  const docNumber = 'TEST-CNI-99999';

  try {
    // 1. Create Dossier A
    console.log("Creating Dossier A...");
    const dossierA: any = {
      id: testDossierAId,
      mairie_id: 'mairie_cocody',
      spouse1_name: 'Alexandre',
      spouse2_name: 'Béatrice',
      wedding_date: '10 Septembre',
      status: 'under_review'
    };
    await createDossier(dossierA);

    // 2. Upload doc for Dossier A with docNumber
    console.log("Uploading CNI for Dossier A with number:", docNumber);
    await updateDocumentInDb(testDossierAId, 'doc2', 'verified', 'cni_test_a.pdf', undefined, docNumber);

    // 3. Create Dossier B
    console.log("Creating Dossier B...");
    const dossierB: any = {
      id: testDossierBId,
      mairie_id: 'mairie_cocody',
      spouse1_name: 'Charles',
      spouse2_name: 'Dorothée',
      wedding_date: '20 Octobre',
      status: 'under_review'
    };
    await createDossier(dossierB);

    // 4. Run duplicate check for Dossier B using the same docNumber
    console.log("Checking duplicate for Dossier B...");
    const checkResult = await checkDuplicateDocumentNumber(docNumber, 'doc2', testDossierBId);
    console.log("Check result:", JSON.stringify(checkResult, null, 2));

    // Assertions
    if (checkResult && checkResult.exists) {
      console.log("\x1b[32m%s\x1b[0m", "✓ SUCCESS: Duplicate check blocked the upload and found conflict!");
      if (checkResult.dossierDetails) {
        console.log(`Conflict details: Spouses = ${checkResult.dossierDetails.spouse1} & ${checkResult.dossierDetails.spouse2}, Mairie = ${checkResult.dossierDetails.mairieName}`);
      }
    } else {
      console.log("\x1b[31m%s\x1b[0m", "✗ FAILURE: Duplicate check failed to detect the conflict!");
    }

  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    // Clean up
    console.log("Cleaning up test dossiers...");
    await deleteDossier(testDossierAId);
    await deleteDossier(testDossierBId);
    console.log("Cleanup completed.");
  }
}

runTest();
