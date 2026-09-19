import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const snapshotsDir = resolve(root, 'src/content/daily/snapshots');
assert(!existsSync(snapshotsDir), 'Legacy src/content/daily/snapshots directory must not exist.');
assert(!existsSync(resolve(root, 'src/content/release/DailyReleaseCorpus.ts')), 'Legacy 365-level DailyReleaseCorpus.ts must be removed.');
assert(!existsSync(resolve(root, 'src/content/release/DailyReleaseReservoir.ts')), 'Legacy DailyReleaseReservoir.ts must be removed.');

const dailyBinary = resolve(root, 'public/content/daily/verified-levels.bin');
const dailyManifest = resolve(root, 'public/content/daily/verified-levels-manifest.json');
assert(existsSync(dailyBinary), 'Daily production binary is missing.');
assert(existsSync(dailyManifest), 'Daily production manifest is missing.');
assert(statSync(dailyBinary).size === 7305 * 28, 'Daily production binary must be exactly 7305 × 28 bytes.');

const forbiddenPatterns = [
  /content\/daily\/snapshots/,
  /daily\/snapshots/,
  /curatedDailySnapshots/,
  /from ['\"]\.\/snapshots/,
];
const sourceRoots = ['src', 'scripts'];
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(?:ts|mjs|js)$/.test(entry.name)) continue;
    if (entry.name === 'daily-content-cleanup-sanity.mjs') continue;
    const text = readFileSync(path, 'utf8');
    if (forbiddenPatterns.some((pattern) => pattern.test(text))) offenders.push(relative(root, path));
  }
}
for (const sourceRoot of sourceRoots) walk(resolve(root, sourceRoot));
assert(offenders.length === 0, `Legacy Daily snapshot references remain: ${offenders.join(', ')}`);

const calendar = readFileSync(resolve(root, 'src/content/daily/calendar.ts'), 'utf8');
assert(calendar.includes('DAILY_RELEASE_COUNT = 7305'), 'Daily calendar must remain bound to 7305 entries.');
assert(calendar.includes("padStart(4, '0')"), 'Daily production ids must use four digits.');

console.info('[Dungeon Logic] Daily content cleanup sanity: PASS');
