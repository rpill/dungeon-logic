import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const boot = readFileSync('src/scenes/BootScene.ts', 'utf8');
const home = readFileSync('src/scenes/HomeScene.ts', 'utf8');
const game = readFileSync('src/scenes/GameScene.ts', 'utf8');
const sessions = readFileSync('src/gameplay/PuzzleSessionService.ts', 'utf8');
const profile = readFileSync('src/profile/PlayerProfile.ts', 'utf8');
const types = readFileSync('src/profile/types.ts', 'utf8');
const analytics = readFileSync('src/analytics/AnalyticsService.ts', 'utf8');

assert(boot.includes('await loadEndlessCatalog()') && boot.includes('ENDLESS_SERVICE_REGISTRY_KEY'), 'Boot must load and register the packed Endless catalog.');
assert(home.includes('service.beginCurrent()') && home.includes('createEndlessGameSceneData'), 'Home must launch the current Endless puzzle.');
assert(!home.includes("subtitle: copy.home.endlessSoon,\n      icon: 'endless',\n      enabled: false"), 'Home Endless card must not remain hard-disabled as coming soon.');
assert(game.includes("launchData.context.mode === 'endless'"), 'GameScene must recognize Endless mode.');
assert(game.includes('PuzzleSessionService.createEndless('), 'GameScene must restore/persist Endless sessions.');
assert(game.includes('service.completeCurrent(launchData.context.ordinal)'), 'GameScene must commit Endless progression on solve.');
assert(!game.includes('result.next'), 'Endless completion must not auto-open a precomputed next puzzle.');
assert(game.includes('showEndlessCompletionState'), 'GameScene must show a dedicated Endless victory state.');
assert(game.includes('service.beginCurrent()'), 'Endless Next action must request the next puzzle only after the player presses it.');
assert(sessions.includes('if (this.sealed) return snapshot;') && sessions.includes('this.sealed = true;'), 'PuzzleSessionService must seal completed sessions against stale re-save.');
assert(types.includes('readonly schemaVersion: 5;') && types.includes('readonly endless: EndlessProfileState;'), 'Current profile type must be schema v5 with Endless state.');
assert(profile.includes('schemaVersion: 5') && profile.includes('normalizeEndless(raw.endless, raw.schemaVersion)'), 'Profile normalization must migrate to schema v5 and normalize Endless state.');
assert(analytics.includes("readonly mode: 'endless'") && analytics.includes("mode: 'endless', puzzle_id: context.puzzleId, ordinal: context.ordinal"), 'Analytics must carry Endless mode and ordinal.');

console.log('[Dungeon Logic] Endless runtime integration sanity: Boot + Home + GameScene + sealing + profile + analytics passed');
