process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = 'https://84.234.99.41.sslip.io/api/sessions';
const apiKey = 'owa_k1_9648cda1bdc15b8211fd6f35ab5911f3ed53f46f4cc507fb5f49c97ff1f04a35';

async function main() {
  try {
    const res = await fetch(url, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    console.log("Status Code:", res.status);
    const text = await res.text();
    console.log("Response text:");
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(text);
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

main();
