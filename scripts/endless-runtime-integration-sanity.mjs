import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const boot = readFileSync('src/scenes/BootScene.ts', 'utf8');
const home = readFileSync('src/scenes/HomeScene.ts', 'utf8');
const game = readFileSync('src/scenes/GameScene.ts', 'utf8');
const service = readFileSync('src/endless/EndlessService.ts', 'utf8');
const sessions = readFileSync('src/gameplay/PuzzleSessionService.ts', 'utf8');
const profile = readFileSync('src/profile/PlayerProfile.ts', 'utf8');
const types = readFileSync('src/profile/types.ts', 'utf8');
const analytics = readFileSync('src/analytics/AnalyticsService.ts', 'utf8');

assert(boot.includes('loadEndlessCatalog()') && boot.includes('ENDLESS_SERVICE_REGISTRY_KEY'), 'Boot must load and register the packed Endless catalog.');
assert(home.includes('service.beginCurrent()') && home.includes('createEndlessGameSceneData'), 'Home must launch the current Endless puzzle.');
assert(game.includes("launchData.context.mode === 'endless'"), 'GameScene must recognize Endless mode.');
assert(game.includes('PuzzleSessionService.createEndless('), 'GameScene must restore/persist Endless sessions.');
assert(game.includes('service.completeCurrent(launchData.context.ordinal, metadata.minHintsUsed)'), 'GameScene must commit Endless progression with hint usage on solve.');
assert(game.includes('endlessService.skipCurrent(endlessContext.ordinal)'), 'GameScene Skip must defer the active Endless puzzle.');
assert(game.includes('copy.game.skipBody') && game.includes('copy.game.skipFreePlayBody'), 'Skip must warn about ranked streak reset and distinguish Free Play.');
assert(service.includes('ENDLESS_RETRY_INTERVAL = 10'), 'Skipped ranked puzzles must retry after ten newly solved fresh puzzles.');
assert(service.includes("kind: 'freeplay'"), 'Completed ranked catalog must enter Free Play.');
assert(service.includes('ratingAward = ranked'), 'Only ranked Endless solves may award Master Rating.');
assert(service.includes('catalogIndex: endless.freePlayOrdinal % this.catalog.length'), 'Free Play must cycle the finite catalog after ranked completion.');
assert(!existsSync('src/endless/EndlessLevelPicker.ts'), 'Runtime random/repeating EndlessLevelPicker must be removed.');
assert(sessions.includes('if (this.sealed) return snapshot;') && sessions.includes('this.sealed = true;'), 'PuzzleSessionService must seal completed/skipped sessions against stale re-save.');
assert(types.includes('readonly schemaVersion: 1;') && types.includes('readonly nextFreshIndex: number;') && types.includes('readonly skipped: readonly number[];'), 'Current pre-release profile must store finite ranked Endless progress.');
assert(types.includes('readonly rating: number;') && profile.includes('rating: MASTER_RATING_BASE'), 'Player profile must persist Master Rating from its base value.');
assert(analytics.includes("readonly mode: 'endless'") && analytics.includes("mode: 'endless', puzzle_id: context.puzzleId, ordinal: context.ordinal"), 'Analytics must carry Endless mode and ordinal.');

console.log('[Dungeon Logic] Endless runtime integration sanity: unique ranked catalog + skip queue + Free Play + rating passed');
