import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, truncate, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { auditReleaseDirectory } from './release-audit-lib.mjs';
import { RELEASE_SANITY_SCRIPTS, runReleaseAcceptance } from './release-acceptance.mjs';

async function expectFailure(root, pattern, message) {
  await assert.rejects(
    () => auditReleaseDirectory(root),
    pattern,
    message,
  );
}

async function writeValidRelease(root) {
  await mkdir(join(root, 'assets'), { recursive: true });
  await writeFile(
    join(root, 'index.html'),
    '<!doctype html><html><head><script src="/sdk.js"></script><script type="module" src="./assets/app.js"></script></head><body></body></html>',
    'utf8',
  );
  await writeFile(join(root, 'assets', 'app.js'), 'console.log("ok")', 'utf8');
}


const requiredReleaseSanities = [
  'sanity:yandex-paths',
  'sanity:platform',
  'sanity:platform-gameplay',
  'sanity:i18n',
  'sanity:profile',
  'sanity:settings',
  'sanity:campaign',
  'sanity:campaign-preview',
  'sanity:campaign-release',
  'sanity:daily',
  'sanity:daily-calendar',
  'sanity:daily-corpus',
  'sanity:stats',
  'sanity:responsive-shell',
  'sanity:live-resize',
  'sanity:level-select-scroll',
  'sanity:puzzle-session',
  'sanity:monetization',
  'sanity:rewarded-hint',
  'sanity:human',
  'sanity:difficulty',
  'sanity:release-curation',
];
for (const script of requiredReleaseSanities) {
  assert(RELEASE_SANITY_SCRIPTS.includes(script), `Unified release gate includes ${script}.`);
}
assert.equal(
  new Set(RELEASE_SANITY_SCRIPTS).size,
  RELEASE_SANITY_SCRIPTS.length,
  'Unified release gate does not run the same sanity twice.',
);

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
for (const script of RELEASE_SANITY_SCRIPTS) {
  assert.equal(typeof packageJson.scripts?.[script], 'string', `package.json defines ${script}.`);
}
assert.equal(packageJson.scripts?.['sanity:release'], 'node scripts/release-acceptance.mjs', 'package.json exposes the unified release gate.');
assert.equal(packageJson.scripts?.['audit:release-package'], 'node scripts/release-audit.mjs', 'package.json exposes standalone release package audit with optional root override.');

const orchestrationSteps = [];
await runReleaseAcceptance({
  runScript: async (script) => { orchestrationSteps.push(`npm:${script}`); },
  audit: async () => {
    orchestrationSteps.push('audit:dist');
    return { rootPath: 'dist', fileCount: 1, totalBytes: 1 };
  },
  log: () => {},
});
assert.deepEqual(
  orchestrationSteps.slice(0, RELEASE_SANITY_SCRIPTS.length),
  RELEASE_SANITY_SCRIPTS.map((script) => `npm:${script}`),
  'Unified release gate runs every configured sanity in order.',
);
assert.deepEqual(
  orchestrationSteps.slice(-2),
  ['npm:build', 'audit:dist'],
  'Unified release gate runs production build and package audit last.',
);

const workspace = await mkdtemp(join(tmpdir(), 'dungeon-logic-release-audit-'));
try {
  const valid = join(workspace, 'valid');
  await writeValidRelease(valid);
  const validSummary = await auditReleaseDirectory(valid);
  assert.equal(validSummary.fileCount, 2, 'Valid release reports every file.');
  assert(validSummary.totalBytes > 0, 'Valid release reports non-zero size.');


  const rootAbsoluteApp = join(workspace, 'root-absolute-app');
  await mkdir(join(rootAbsoluteApp, 'assets'), { recursive: true });
  await writeFile(
    join(rootAbsoluteApp, 'index.html'),
    '<!doctype html><html><head><script src="/sdk.js"></script><link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/app.js"></script></head></html>',
    'utf8',
  );
  await writeFile(join(rootAbsoluteApp, 'assets', 'app.js'), '', 'utf8');
  await writeFile(join(rootAbsoluteApp, 'assets', 'app.css'), '', 'utf8');
  await expectFailure(
    rootAbsoluteApp,
    /root-absolute.*assets|package-relative/i,
    'Built app JS/CSS must be package-relative for Yandex archive hosting.',
  );

  const missingIndex = join(workspace, 'missing-index');
  await mkdir(missingIndex, { recursive: true });
  await writeFile(join(missingIndex, 'app.js'), '', 'utf8');
  await expectFailure(missingIndex, /index\.html/i, 'Missing root index must fail.');

  const spaced = join(workspace, 'spaced');
  await writeValidRelease(spaced);
  await writeFile(join(spaced, 'assets', 'bad name.js'), '', 'utf8');
  await expectFailure(spaced, /whitespace/i, 'Whitespace in release paths must fail.');

  const cyrillic = join(workspace, 'cyrillic');
  await writeValidRelease(cyrillic);
  await writeFile(join(cyrillic, 'assets', 'уровень.js'), '', 'utf8');
  await expectFailure(cyrillic, /Cyrillic/i, 'Cyrillic release paths must fail.');

  const oversized = join(workspace, 'oversized');
  await writeValidRelease(oversized);
  const hugePath = join(oversized, 'assets', 'huge.bin');
  await writeFile(hugePath, '', 'utf8');
  await truncate(hugePath, 100_000_001);
  await expectFailure(oversized, /100,000,000/i, 'Oversized release must fail the conservative package ceiling.');

  const viteHoistedOrder = join(workspace, 'vite-hoisted-order');
  await mkdir(join(viteHoistedOrder, 'assets'), { recursive: true });
  await writeFile(
    join(viteHoistedOrder, 'index.html'),
    '<!doctype html><html><head><script type="module" src="./assets/app.js"></script><script src="/sdk.js"></script></head></html>',
    'utf8',
  );
  await writeFile(join(viteHoistedOrder, 'assets', 'app.js'), '', 'utf8');
  await auditReleaseDirectory(viteHoistedOrder);

  const asyncSdk = join(workspace, 'async-sdk');
  await mkdir(join(asyncSdk, 'assets'), { recursive: true });
  await writeFile(
    join(asyncSdk, 'index.html'),
    '<!doctype html><html><head><script async src="/sdk.js"></script><script type="module" src="./assets/app.js"></script></head></html>',
    'utf8',
  );
  await writeFile(join(asyncSdk, 'assets', 'app.js'), '', 'utf8');
  await expectFailure(asyncSdk, /synchronous/i, 'Current bootstrap requires the relative SDK script to load synchronously.');

  const absoluteSdk = join(workspace, 'absolute-sdk');
  await mkdir(join(absoluteSdk, 'assets'), { recursive: true });
  await writeFile(
    join(absoluteSdk, 'index.html'),
    '<!doctype html><html><head><script src="https://sdk.games.s3.yandex.net/sdk.js"></script><script type="module" src="./assets/app.js"></script></head></html>',
    'utf8',
  );
  await writeFile(join(absoluteSdk, 'assets', 'app.js'), '', 'utf8');
  await expectFailure(absoluteSdk, /absolute Yandex SDK S3/i, 'Archive deployment must not use the absolute Yandex SDK S3 URL.');

  console.info('[Dungeon Logic] Release package audit sanity: package root/size/path/SDK contracts passed');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
