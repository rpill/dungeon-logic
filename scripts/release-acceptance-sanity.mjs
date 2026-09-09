import assert from 'node:assert/strict';

const acceptance = await import('./release-acceptance.mjs');

assert.equal(
  typeof acceptance.getNpmInvocation,
  'function',
  'release acceptance must expose a testable npm invocation resolver',
);

assert(
  acceptance.RELEASE_SANITY_SCRIPTS.includes('sanity:tutorial'),
  'release acceptance must run the dedicated Tutorial regression gate',
);

const windowsInvocation = acceptance.getNpmInvocation({
  platform: 'win32',
  execPath: 'C:\\Program Files\\nodejs\\node.exe',
  env: {
    npm_execpath: 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js',
    ComSpec: 'C:\\Windows\\System32\\cmd.exe',
  },
});
assert.deepEqual(windowsInvocation, {
  command: 'C:\\Program Files\\nodejs\\node.exe',
  argsPrefix: ['C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js'],
});
assert.notEqual(windowsInvocation.command.toLowerCase(), 'npm.cmd');

const windowsFallback = acceptance.getNpmInvocation({
  platform: 'win32',
  execPath: 'C:\\Program Files\\nodejs\\node.exe',
  env: { ComSpec: 'C:\\Windows\\System32\\cmd.exe' },
});
assert.deepEqual(windowsFallback, {
  command: 'C:\\Windows\\System32\\cmd.exe',
  argsPrefix: ['/d', '/s', '/c', 'npm'],
});

const posixFallback = acceptance.getNpmInvocation({
  platform: 'linux',
  execPath: '/usr/bin/node',
  env: {},
});
assert.deepEqual(posixFallback, {
  command: 'npm',
  argsPrefix: [],
});

console.info('[Dungeon Logic] Release acceptance runner sanity: cross-platform npm invocation passed');
