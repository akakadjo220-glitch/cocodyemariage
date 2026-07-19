const sql = `
ALTER TABLE documents_dossiers ADD COLUMN IF NOT EXISTS nombre_tentatives INTEGER DEFAULT 0;
`;

async function main() {
  const url = 'http://84.234.99.41:8000/api/projects/default/query';
  console.log(`Sending query to: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
    if (res.ok) {
      console.log("✅ SQL Migration successfully executed!");
    } else {
      console.error("❌ SQL Migration failed.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error connecting to Studio:", err);
    process.exit(1);
  }
}

main();
