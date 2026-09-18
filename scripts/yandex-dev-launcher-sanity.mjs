import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(
  packageJson.scripts['dev:yandex'],
  'node scripts/yandex-dev.mjs',
  'dev:yandex must launch both Vite and Yandex proxy through one Node launcher.',
);

const launcher = await import('./yandex-dev.mjs');
const { findAvailablePort } = launcher;
assert.equal(
  typeof launcher.findAvailableProxyPort,
  'function',
  'Launcher must expose a proxy-port scanner that matches the Yandex proxy wildcard bind.',
);


function occupyIpv6Only(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen({ host: '::', port, ipv6Only: true }, () => resolve(server));
  });
}

function occupy(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port }, () => resolve(server));
  });
}

async function close(server) {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

const occupiedVite = await occupy(5173);
try {
  assert.equal(
    await findAvailablePort(5173, '127.0.0.1'),
    5174,
    'When Vite port 5173 is occupied, launcher must choose 5174.',
  );
} finally {
  await close(occupiedVite);
}

let occupiedProxy = null;
try {
  occupiedProxy = await occupy(8080);
} catch (error) {
  if (!error || error.code !== 'EADDRINUSE') throw error;
}

try {
  const selectedProxyPort = await launcher.findAvailableProxyPort(8080);
  assert(
    selectedProxyPort > 8080,
    'When proxy port 8080 is occupied, launcher must choose a later free port.',
  );
} finally {
  if (occupiedProxy) await close(occupiedProxy);
}

let occupiedIpv6Proxy = null;
let ipv6OnlyPort = null;
try {
  occupiedIpv6Proxy = await occupyIpv6Only(0);
  ipv6OnlyPort = occupiedIpv6Proxy.address().port;
} catch (error) {
  if (!error || error.code !== 'EADDRINUSE') throw error;
}

try {
  if (occupiedIpv6Proxy && ipv6OnlyPort !== null) {
    const selectedProxyPort = await launcher.findAvailableProxyPort(ipv6OnlyPort);
    assert(
      selectedProxyPort > ipv6OnlyPort,
      'When a port is occupied only on IPv6, the proxy scanner must skip it.',
    );
  }
} finally {
  if (occupiedIpv6Proxy) await close(occupiedIpv6Proxy);
}

console.info('[Dungeon Logic] Yandex dev launcher sanity: PASS');
