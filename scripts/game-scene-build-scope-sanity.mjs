import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const fail = (message) => { throw new Error(message); };

const createStart = source.indexOf('  create(): void {');
const createGameStart = source.indexOf('  private createGame(');
if (createStart < 0 || createGameStart < 0) fail('GameScene create/createGame methods must exist.');
const createBody = source.slice(createStart, createGameStart);
const createGameBody = source.slice(createGameStart);

if (createBody.includes('let uiDensity = resolveUiDensity(')) {
  fail('uiDensity must not be scoped to create(); createGame owns the UI closure that uses it.');
}
if (!createGameBody.includes('let uiDensity = resolveUiDensity(this.scale.width, this.scale.height);')) {
  fail('createGame must own mutable uiDensity for initial render and live resize.');
}
for (const staleImport of ['getRecentDailyHistory,', '  createCampaignGameSceneData,', "import { LEADERBOARD_SCENE_KEY } from './LeaderboardScene';"]) {
  if (source.includes(staleImport)) fail(`GameScene still contains unused import: ${staleImport}`);
}
console.info('[Dungeon Logic] GameScene build-scope sanity: PASS');
