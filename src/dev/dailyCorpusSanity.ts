import { readFileSync } from 'node:fs';

import {
  DAILY_RECORD_SIZE,
  decodeDailyCatalogRecord,
  isDailyCatalogManifest,
} from '../content/daily/CatalogFormat';
import {
  DAILY_RELEASE_COUNT,
  DAILY_RELEASE_DATE_KEYS,
  formatDailyId,
} from '../content/daily/calendar';
import { isDailyDifficultyAllowed } from '../content/daily/WeekdayPolicy';
import { promotedCampaignLevels } from '../content/campaign/levels';
import { campaignReleaseStructuralFingerprint } from '../content/release/CampaignReleaseSelection';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const manifestValue: unknown = JSON.parse(readFileSync('public/content/daily/verified-levels-manifest.json', 'utf8'));
assert(isDailyCatalogManifest(manifestValue), 'Daily production manifest header is invalid.');
const manifest = manifestValue;
const binary = readFileSync('public/content/daily/verified-levels.bin');
assert(manifest.entryCount === DAILY_RELEASE_COUNT, 'Daily production catalog must contain exactly 7305 entries.');
assert(manifest.catalogTargetCount === DAILY_RELEASE_COUNT, 'Daily production target count must be 7305.');
assert(binary.byteLength === DAILY_RELEASE_COUNT * DAILY_RECORD_SIZE, 'Daily binary byte length does not match the fixed record format.');
assert(manifest.startDate === DAILY_RELEASE_DATE_KEYS[0], 'Daily manifest start date drifted.');
assert(manifest.endDate === DAILY_RELEASE_DATE_KEYS[DAILY_RELEASE_COUNT - 1], 'Daily manifest end date drifted.');
assert(manifest.verifiedCount === DAILY_RELEASE_COUNT, 'Every Daily record must be verified.');
assert(manifest.duplicateCount === 0, 'Daily manifest reports duplicate levels.');
assert(manifest.campaignCollisionCount === 0, 'Daily manifest reports Campaign collisions.');
assert(manifest.endlessCollisionCount === 0, 'Daily manifest reports Endless collisions.');
assert(manifest.weekdayViolationCount === 0, 'Daily manifest reports weekday difficulty violations.');

const campaignFingerprints = new Set(
  promotedCampaignLevels.map((entry) => campaignReleaseStructuralFingerprint(entry.level.solution)),
);
const endlessFingerprints = new Set<string>();
for (const line of readFileSync('.generated/endless/selection.jsonl', 'utf8').trim().split('\n')) {
  if (line.trim().length === 0) continue;
  const record = JSON.parse(line) as { structuralFingerprint?: unknown };
  if (typeof record.structuralFingerprint === 'string') endlessFingerprints.add(record.structuralFingerprint);
}

const dailyFingerprints = new Set<string>();
for (let index = 0; index < DAILY_RELEASE_COUNT; index += 1) {
  const id = formatDailyId(index);
  const dateKey = DAILY_RELEASE_DATE_KEYS[index];
  const record = decodeDailyCatalogRecord(binary, manifest, index, id);
  const level = record.level;
  assert(level.id === id, `Daily id mismatch at ordinal ${index + 1}.`);
  assert(level.width === record.size && level.height === record.size, `Daily ${id} size mismatch.`);
  assert(level.blockers.length === 0 && level.doors.length === 0, `Daily ${id} contains forbidden mechanics.`);
  assert(isDailyDifficultyAllowed(dateKey, record.difficultyScore), `Daily ${id} score ${record.difficultyScore} violates ${dateKey} weekday band.`);
  const fingerprint = campaignReleaseStructuralFingerprint(level.solution);
  assert(!dailyFingerprints.has(fingerprint), `Daily ${id} duplicates another Daily.`);
  assert(!campaignFingerprints.has(fingerprint), `Daily ${id} duplicates Campaign geometry.`);
  assert(!endlessFingerprints.has(fingerprint), `Daily ${id} duplicates Endless geometry.`);
  dailyFingerprints.add(fingerprint);
}

console.info('[Dungeon Logic] Daily corpus sanity: 7305 binary records + weekday bands + global collision gates passed');
