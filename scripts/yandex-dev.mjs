import { createConnection, createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEV_HOST = '127.0.0.1';
const VITE_START_PORT = 5173;
const PROXY_START_PORT = 8080;
const PORT_SCAN_LIMIT = 200;
const VITE_READY_TIMEOUT_MS = 30_000;
const PROXY_READY_TIMEOUT_MS = 90_000;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 1_500;
const FORCE_SHUTDOWN_TIMEOUT_MS = 1_500;

function canListen(port, host) {
  return new Promise((resolveResult, reject) => {
    const server = createServer();

    const cleanup = () => {
      server.removeAllListeners();
    };

    server.once('error', (error) => {
      cleanup();
      if (error && (error.code === 'EADDRINUSE' || error.code === 'EACCES')) {
        resolveResult(false);
        return;
      }
      reject(error);
    });

    server.listen({ host, port, exclusive: true }, () => {
      server.close((error) => {
        cleanup();
        if (error) reject(error);
        else resolveResult(true);
      });
    });
  });
}

export async function findAvailablePort(startPort, host = DEV_HOST) {
  for (let offset = 0; offset < PORT_SCAN_LIMIT; offset += 1) {
    const port = startPort + offset;
    if (await canListen(port, host)) return port;
  }

  throw new Error(`No free port found from ${startPort} to ${startPort + PORT_SCAN_LIMIT - 1}.`);
}

function canListenWildcard(port) {
  return new Promise((resolveResult, reject) => {
    const server = createServer();

    const cleanup = () => {
      server.removeAllListeners();
    };

    server.once('error', (error) => {
      cleanup();
      if (error && (error.code === 'EADDRINUSE' || error.code === 'EACCES')) {
        resolveResult(false);
        return;
      }
      reject(error);
    });

    // Match sdk-dev-proxy's Server.listen(port) semantics: do not force IPv4.
    // On Windows an IPv6/wildcard listener can conflict even when 127.0.0.1 looks free.
    server.listen(port, () => {
      server.close((error) => {
        cleanup();
        if (error) reject(error);
        else resolveResult(true);
      });
    });
  });
}

export async function findAvailableProxyPort(startPort) {
  for (let offset = 0; offset < PORT_SCAN_LIMIT; offset += 1) {
    const port = startPort + offset;
    if (await canListenWildcard(port)) return port;
  }

  throw new Error(`No free proxy port found from ${startPort} to ${startPort + PORT_SCAN_LIMIT - 1}.`);
}

function waitForPort(port, child, timeoutMs, host = DEV_HOST) {
  return new Promise((resolveReady, reject) => {
    const startedAt = Date.now();
    let timer = null;
    let settled = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      child.off('exit', onExit);
      child.off('error', onError);
    };

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };

    const onExit = (code, signal) => {
      finish(
        reject,
        new Error(`Process exited before port ${port} became ready (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`),
      );
    };

    const onError = (error) => finish(reject, error);

    const probe = () => {
      if (settled) return;
      if (Date.now() - startedAt >= timeoutMs) {
        finish(reject, new Error(`Timed out waiting for ${host}:${port}.`));
        return;
      }

      const socket = createConnection({ host, port });
      socket.setTimeout(500);
      socket.once('connect', () => {
        socket.destroy();
        finish(resolveReady);
      });
      const retry = () => {
        socket.destroy();
        if (!settled) timer = setTimeout(probe, 120);
      };
      socket.once('error', retry);
      socket.once('timeout', retry);
    };

    child.once('exit', onExit);
    child.once('error', onError);
    probe();
  });
}

function startVite(port) {
  const viteCli = resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteCli)) {
    throw new Error(`Vite CLI not found at ${viteCli}. Run npm install first.`);
  }

  return spawn(
    process.execPath,
    [viteCli, '--host', DEV_HOST, '--port', String(port), '--strictPort'],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    },
  );
}

function startYandexProxy(vitePort, proxyPort) {
  const args = [
    '--yes',
    '@yandex-games/sdk-dev-proxy',
    '-h',
    `http://${DEV_HOST}:${vitePort}`,
    '--dev-mode=true',
    '--port',
    String(proxyPort),
  ];

  return spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function hasChildExited(child) {
  return !child || child.exitCode !== null || child.signalCode !== null;
}

function waitForChildExit(child, timeoutMs) {
  if (hasChildExited(child)) return Promise.resolve(true);

  return new Promise((resolveResult) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off('exit', onExit);
      resolveResult(value);
    };
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once('exit', onExit);
  });
}

function runTaskkill(pid, force) {
  return new Promise((resolveResult) => {
    const args = ['/pid', String(pid), '/T'];
    if (force) args.push('/F');

    const killer = spawn('taskkill', args, {
      stdio: 'ignore',
      windowsHide: true,
    });
    killer.once('error', () => resolveResult());
    killer.once('exit', () => resolveResult());
  });
}

export async function stopProcessTreeGracefully(
  child,
  timeoutMs = GRACEFUL_SHUTDOWN_TIMEOUT_MS,
) {
  if (!child || !child.pid || hasChildExited(child)) return;

  try {
    child.kill('SIGTERM');
  } catch {
    // The child may already be exiting because Ctrl+C is broadcast to the console group.
  }

  if (await waitForChildExit(child, timeoutMs)) return;

  if (process.platform === 'win32') {
    await runTaskkill(child.pid, true);
  } else {
    try {
      child.kill('SIGKILL');
    } catch {
      return;
    }
  }

  await waitForChildExit(child, FORCE_SHUTDOWN_TIMEOUT_MS);
}

export async function runYandexDev() {
  const vitePort = await findAvailablePort(VITE_START_PORT);

  console.log(`[dev:yandex] Vite: starting on http://localhost:${vitePort}`);
  if (vitePort !== VITE_START_PORT) {
    console.log(`[dev:yandex] Port ${VITE_START_PORT} is busy; using ${vitePort}.`);
  }
  let vite = null;
  let proxy = null;
  let shuttingDown = false;
  let shutdownPromise = null;

  const shutdown = (exitCode = 0) => {
    if (shutdownPromise !== null) return shutdownPromise;

    shuttingDown = true;
    shutdownPromise = (async () => {
      await Promise.allSettled([
        stopProcessTreeGracefully(proxy),
        stopProcessTreeGracefully(vite),
      ]);
      process.exitCode = exitCode;
    })();
    return shutdownPromise;
  };

  const handleUnexpectedExit = (name) => (code, signal) => {
    if (shuttingDown) return;
    console.error(`[dev:yandex] ${name} stopped unexpectedly (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`);
    void shutdown(code && code !== 0 ? code : 1);
  };

  process.once('SIGINT', () => {
    console.log('\n[dev:yandex] Stopping...');
    void shutdown(0);
  });
  process.once('SIGTERM', () => {
    void shutdown(0);
  });

  try {
    vite = startVite(vitePort);
    vite.once('exit', handleUnexpectedExit('Vite'));
    await waitForPort(vitePort, vite, VITE_READY_TIMEOUT_MS);

    const proxyPort = await findAvailableProxyPort(PROXY_START_PORT);
    if (proxyPort !== PROXY_START_PORT) {
      console.log(`[dev:yandex] Port ${PROXY_START_PORT} is busy; Yandex proxy will use ${proxyPort}.`);
    }

    console.log(`[dev:yandex] Vite ready. Starting Yandex proxy on https://localhost:${proxyPort}`);
    proxy = startYandexProxy(vitePort, proxyPort);
    proxy.once('exit', handleUnexpectedExit('Yandex proxy'));
    await waitForPort(proxyPort, proxy, PROXY_READY_TIMEOUT_MS);

    console.log('');
    console.log(`[dev:yandex] Ready: https://localhost:${proxyPort}`);
    console.log(`[dev:yandex] Vite upstream: http://localhost:${vitePort}`);
    console.log('[dev:yandex] Press Ctrl+C to stop both processes.');
  } catch (error) {
    if (shuttingDown) {
      await shutdown(0);
      return;
    }

    await shutdown(1);
    throw error;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  runYandexDev().catch((error) => {
    console.error(`[dev:yandex] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
