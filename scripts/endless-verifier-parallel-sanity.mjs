import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cli = readFileSync('src/dev/endless/cli.ts', 'utf8');
const verifier = readFileSync('src/dev/endless/Verifier.ts', 'utf8');
const artifacts = readFileSync('src/dev/endless/PipelineArtifacts.ts', 'utf8');
const childEntry = readFileSync('src/dev/endless/VerifierWorker.ts', 'utf8');

assert(existsSync('src/dev/endless/VerifierWorker.ts'), 'Parallel verifier must provide a dedicated verifier child entry module.');
assert(verifier.includes("from 'node:child_process'"), 'Parallel verifier must use child_process so tsx is registered in a full Node child process.');
assert(verifier.includes('fork('), 'Parallel verifier must launch verifier children with fork().');
assert(verifier.includes("execArgv: ['--import', 'tsx']"), 'Verifier child process must explicitly register tsx.');
assert(!verifier.includes("from 'node:worker_threads'"), 'Verifier orchestrator must not use worker_threads because tsx loader registration is unreliable there.');
assert(!childEntry.includes("node:worker_threads"), 'Verifier child entry must not depend on worker_threads.');
assert(childEntry.includes("process.on(\n  'message'"), 'Verifier child entry must receive chunks through child-process IPC.');
assert(childEntry.includes('process.send?.(response)'), 'Verifier child entry must return results through child-process IPC.');
assert(verifier.includes('verifyEndlessSelectionParallel'), 'Verifier must expose a parallel verification orchestrator.');
assert(verifier.includes('ENDLESS VERIFY PROGRESS'), 'Parallel verifier must emit progress while processing a large catalog.');
assert(verifier.includes('jobs'), 'Parallel verifier must accept an explicit worker count.');
assert(verifier.includes('resume'), 'Parallel verifier must support checkpoint resume.');
assert(artifacts.includes('verification.checkpoint.json'), 'Verification checkpoint must use a stable artifact filename.');
assert(cli.includes("'--jobs'"), 'Verify CLI must accept --jobs.');
assert(cli.includes("['--resume']"), 'Verify CLI must accept --resume.');
assert(cli.includes('runEndlessVerifyCli'), 'Main CLI path must use the async parallel verifier for verify.');

console.info('[Dungeon Logic] Endless verifier parallel sanity: forked processes + progress + checkpoint resume wiring passed');
