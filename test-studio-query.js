async function main() {
  const url = 'http://84.234.99.41:8000/api/projects/default/query';
  console.log("Sending test query to Studio...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT 1;'
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
