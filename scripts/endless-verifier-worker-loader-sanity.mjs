import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const verifier = readFileSync('src/dev/endless/Verifier.ts', 'utf8');

assert(
  verifier.includes("execArgv: ['--import', 'tsx']"),
  'Verifier worker must explicitly preload tsx so extensionless TypeScript imports resolve inside worker_threads.',
);

console.info('[Dungeon Logic] Endless verifier worker loader sanity passed');
