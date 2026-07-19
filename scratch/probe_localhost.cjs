async function main() {
  const url = 'http://localhost:3000/';
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Content (first 500 chars): ${text.slice(0, 500)}`);
  } catch (err) {
    console.log(`Failed: ${err.message}`);
  }
}

main();
