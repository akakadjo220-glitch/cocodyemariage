process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sessionName = 'bb4e0599-8e3c-4055-813a-02cd70dd520d';
const url = `https://84.234.99.41.sslip.io/api/sessions/${sessionName}/messages/send-text`;
const apiKey = 'owa_k1_9648cda1bdc15b8211fd6f35ab5911f3ed53f46f4cc507fb5f49c97ff1f04a35';

async function main() {
  try {
    const payload = {
      chatId: '22544246972@c.us', // sending to self
      text: 'Test message from E-Mariage OpenWA integration!'
    };
    
    console.log("Sending payload to:", url);
    console.log("Payload:", JSON.stringify(payload));
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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
