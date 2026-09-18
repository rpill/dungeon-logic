import { spawn } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const launcher = await import('./yandex-dev.mjs');
assert.equal(
  typeof launcher.stopProcessTreeGracefully,
  'function',
  'Launcher must expose an awaited graceful child shutdown helper.',
);

const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
  stdio: 'ignore',
});

const startedAt = Date.now();
await launcher.stopProcessTreeGracefully(child, 2_000);
assert(
  child.exitCode !== null || child.signalCode !== null,
  'Graceful shutdown must wait until the child process has actually exited.',
);
assert(Date.now() - startedAt < 2_500, 'Graceful shutdown must not hang.');

const source = readFileSync(new URL('./yandex-dev.mjs', import.meta.url), 'utf8');
assert(
  source.includes("process.once('SIGINT', () => {"),
  'Launcher must handle Ctrl+C explicitly.',
);
assert(
  source.includes('void shutdown(0);'),
  'Ctrl+C must route through the expected-success shutdown path.',
);
assert(
  source.includes('process.exitCode = exitCode;'),
  'Expected shutdown must control the launcher exit code explicitly.',
);

console.info('[Dungeon Logic] Yandex dev graceful shutdown sanity: PASS');
