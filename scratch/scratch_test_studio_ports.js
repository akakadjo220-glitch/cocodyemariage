const net = require('net');

const targets = [
  { host: 'localhost', ports: [54320, 54321, 54322, 54323, 54324, 8000, 8080, 3000] },
  { host: '84.234.99.41', ports: [54320, 54321, 54322, 54323, 54324, 8000, 8080, 6543, 5432] }
];

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function run() {
  console.log("Starting port check...");
  for (const target of targets) {
    for (const port of target.ports) {
      const open = await checkPort(target.host, port);
      if (open) {
        console.log(`📡 Port ${port} is OPEN on ${target.host}`);
      }
    }
  }
  console.log("Port check completed.");
}

run();
