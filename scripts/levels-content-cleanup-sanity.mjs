import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const unlocks = source('src/campaign/CampaignUnlocks.ts');
const uiCopy = source('src/i18n/UiCopy.ts');
const statsScene = source('src/scenes/StatsScene.ts');
const tutorialSanity = source('src/dev/tutorialSanity.ts');
const responsiveSanity = source('src/dev/responsiveShellSanity.ts');
const currentState = source('CURRENT_STATE.md');
const tech = source('TECH.md');
const campaignReport = source('docs/content/campaign-v1-curation-report.md');
const openingCampaignLevels = Array.from({ length: 6 }, (_, index) =>
  source(`src/content/campaign/levels/campaign${String(index + 1).padStart(3, '0')}.ts`),
);
const dailyCalendarReport = source('docs/release/daily-calendar-v1.md');
const dailyCorpusReport = source('docs/release/daily-corpus-v1.md');
const pkg = JSON.parse(source('package.json'));
const releaseAcceptance = source('scripts/release-acceptance.mjs');

assert(!unlocks.includes('manuscript'), 'CampaignUnlocks must contain no manuscript progression code.');
assert(!uiCopy.includes('manuscript'), 'UiCopy must contain no player-facing manuscript copy.');
assert(!statsScene.includes('.manuscripts('), 'StatsScene must not render manuscript statistics.');
assert(!existsSync(resolve(process.cwd(), 'src/scenes/ArchiveScene.ts')), 'Obsolete campaign ArchiveScene must be removed.');
assert(!existsSync(resolve(process.cwd(), 'src/content/campaign/manuscripts.ts')), 'Obsolete manuscript definitions must be removed.');
assert(!existsSync(resolve(process.cwd(), 'src/content/campaign/chapters.ts')), 'Obsolete campaign chapter definitions must be removed.');
assert(!existsSync(resolve(process.cwd(), 'src/content/campaign/themes.ts')), 'Chapter-bound campaign theme registry must be removed.');
assert(pkg.scripts['sanity:campaign-theme'] === undefined, 'Obsolete campaign-theme sanity script must be removed.');
assert(!releaseAcceptance.includes('sanity:campaign-theme'), 'Release acceptance must not invoke obsolete campaign-theme sanity.');
assert(tutorialSanity.includes('campaignManifest.length === 64'), 'Tutorial sanity must expect the 64-level campaign.');
assert(tutorialSanity.includes("campaign-064"), 'Tutorial sanity must verify campaign IDs through campaign-064.');
assert(responsiveSanity.includes("desktop.columns === 8"), 'Desktop Levels layout sanity must require eight cards per row.');
assert(responsiveSanity.includes('card.numberY > card.y + card.height / 2'), 'Levels layout sanity must keep level numbers below thumbnail squares.');
assert(!currentState.includes('campaign-001`–`campaign-030'), 'CURRENT_STATE must not describe the campaign as 30 levels.');
assert(!currentState.includes('Campaign Chapter I'), 'CURRENT_STATE must not send Tutorial completion to Chapter I.');
assert(!tech.includes('campaign-001`–`campaign-030'), 'TECH must document campaign IDs through 064.');
assert(campaignReport.includes('Campaign 001–064'), 'Campaign curation report must document the 64-level shipped corpus.');

const expectedOpeningCandidateIds = [
  'generated-monster-only-6-2398889868',
  'generated-monster-only-6-2057422507',
  'generated-mixed-one-room-6-3782245294',
  'generated-chest-one-room-7-2320',
  'generated-mixed-one-room-7-1202807671',
  'generated-chest-one-room-7-3193369624',
];
for (let index = 0; index < expectedOpeningCandidateIds.length; index += 1) {
  const slot = index + 1;
  const levelSource = openingCampaignLevels[index];
  assert(
    levelSource.includes(`\"id\": \"campaign-${String(slot).padStart(3, '0')}\"`),
    `Campaign slot ${slot} must keep its stable campaign id.`,
  );
  assert(
    levelSource.includes(`\"sourceCandidateId\": \"${expectedOpeningCandidateIds[index]}\"`),
    `Campaign slot ${slot} must use the approved opening-order puzzle.`,
  );
}
assert(
  campaignReport.includes('| 002 | `monster-only` | easy | 6 | `solved-direct` | `generated-monster-only-6-2057422507` |'),
  'Campaign curation report must reflect the reordered opening sequence.',
);
assert(
  campaignReport.includes('| 006 | `chest-one-room` | easy | 10 | `solved-direct` | `generated-chest-one-room-7-3193369624` |'),
  'Campaign curation report must place the former level 2 puzzle at slot 006.',
);
assert(dailyCalendarReport.includes('Entries: **7,305 consecutive days**'), 'Daily calendar report must document all 7,305 release dates.');
assert(dailyCalendarReport.includes('`daily-7305` → `2046-09-08`'), 'Daily calendar report must include the final bound Daily.');
assert(dailyCorpusReport.includes('Selected records: **7,305**'), 'Daily corpus report must document the 7,305-record shipped corpus.');
assert(dailyCorpusReport.includes('Campaign 001–064'), 'Daily corpus report must document exclusion against all 64 Campaign levels.');

console.info('[Dungeon Logic] Levels/content cleanup sanity: flat 64-level campaign metadata passed');
