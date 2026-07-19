const fs = require('fs');

console.log("Environment variables:");
const env = {};
for (const key of Object.keys(process.env)) {
  // Hide sensitive values partially
  const val = process.env[key];
  if (val.length > 20) {
    env[key] = val.slice(0, 10) + "..." + val.slice(-10);
  } else {
    env[key] = val;
  }
}
console.log(JSON.stringify(env, null, 2));
