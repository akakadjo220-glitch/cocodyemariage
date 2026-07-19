async function runQuery(sql) {
  const url = 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io/api/projects/default/query';
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
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

const sql = process.argv[2] || "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents';";
runQuery(sql);
