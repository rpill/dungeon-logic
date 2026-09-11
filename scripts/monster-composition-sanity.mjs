import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dungeon-monster-composition-'));
try {
  execFileSync('tsc', [
    '--target', 'ES2022',
    '--module', 'NodeNext',
    '--moduleResolution', 'NodeNext',
    '--outDir', tempDir,
    path.join(root, 'src/view/MonsterVisuals.ts'),
  ], { cwd: root, stdio: 'pipe' });

  const compiled = path.join(tempDir, 'MonsterVisuals.js');
  const visuals = await import(`${pathToFileURL(compiled).href}?v=${Date.now()}`);
  const {
    getCampaignMonsterTypeCount,
    resolveMonsterSkin,
    resolveMonsterSkinForLevel,
  } = visuals;

  assert(typeof getCampaignMonsterTypeCount === 'function', 'MonsterVisuals must expose campaign composition selection.');
  assert(typeof resolveMonsterSkinForLevel === 'function', 'MonsterVisuals must expose level-aware monster skin resolution.');

  for (let tutorial = 1; tutorial <= 5; tutorial += 1) {
    const id = `tutorial-${String(tutorial).padStart(3, '0')}`;
    for (let index = 0; index < 6; index += 1) {
      assert(
        resolveMonsterSkinForLevel(id, index, 6, index, 0) === 'monster_pink',
        `${id} must use only monster_pink.`,
      );
    }
  }

  const campaignDir = path.join(root, 'src/content/campaign/levels');
  const campaignFiles = fs.readdirSync(campaignDir)
    .filter((name) => /^campaign\d{3}\.ts$/.test(name))
    .sort();

  const distribution = new Map([[1, 0], [2, 0], [3, 0]]);
  let monsterBearingLevels = 0;

  for (const file of campaignFiles) {
    const source = fs.readFileSync(path.join(campaignDir, file), 'utf8');
    const idMatch = source.match(/"id":\s*"(campaign-\d{3})"/);
    const monstersMatch = source.match(/"monsters":\s*\[(.*?)\],\s*"chests"/s);
    assert(idMatch && monstersMatch, `Could not read campaign id/monsters from ${file}.`);

    const levelId = idMatch[1];
    const monsterCount = (monstersMatch[1].match(/"x"\s*:/g) ?? []).length;
    if (monsterCount === 0) continue;

    monsterBearingLevels += 1;
    const typeCount = getCampaignMonsterTypeCount(levelId, monsterCount);
    assert(typeCount >= 1 && typeCount <= 3, `${levelId} must select 1-3 monster types.`);
    distribution.set(typeCount, (distribution.get(typeCount) ?? 0) + 1);

    const skins = Array.from({ length: monsterCount }, (_, index) => (
      resolveMonsterSkinForLevel(levelId, index, 0, index, monsterCount)
    ));
    const counts = new Map();
    for (const skin of skins) counts.set(skin, (counts.get(skin) ?? 0) + 1);

    assert(counts.size === typeCount, `${levelId} must visibly contain exactly ${typeCount} monster type(s).`);
    if (typeCount >= 2) {
      const orderedCounts = [...counts.values()].sort((a, b) => b - a);
      assert(
        orderedCounts[0] > orderedCounts[1],
        `${levelId} mixed composition must keep one clearly dominant monster type.`,
      );
    }
  }

  assert(monsterBearingLevels > 0, 'Campaign must contain monster-bearing levels.');
  const singleRatio = distribution.get(1) / monsterBearingLevels;
  const doubleRatio = distribution.get(2) / monsterBearingLevels;
  const tripleRatio = distribution.get(3) / monsterBearingLevels;

  assert(singleRatio >= 0.60 && singleRatio <= 0.70, `Single-type campaign ratio must stay near 60-70%; got ${(singleRatio * 100).toFixed(1)}%.`);
  assert(doubleRatio >= 0.25 && doubleRatio <= 0.30, `Two-type campaign ratio must stay near 25-30%; got ${(doubleRatio * 100).toFixed(1)}%.`);
  assert(tripleRatio > 0 && tripleRatio <= 0.10, `Three-type campaign ratio must stay rare; got ${(tripleRatio * 100).toFixed(1)}%.`);

  const daily = resolveMonsterSkinForLevel('daily-001', 2, 3, 0, 4);
  assert(
    daily === resolveMonsterSkin('daily-001', 2, 3),
    'Non-campaign/non-tutorial modes must retain the previous deterministic cell-based skin behavior.',
  );

  const boardSource = fs.readFileSync(path.join(root, 'src/board/BoardView.ts'), 'utf8');
  assert(boardSource.includes('resolveMonsterSkinForLevel'), 'BoardView must use the level-aware monster skin resolver.');

  console.info(
    `[Dungeon Logic] Monster composition sanity: tutorial pink-only; campaign ${(singleRatio * 100).toFixed(1)}% single / ${(doubleRatio * 100).toFixed(1)}% double / ${(tripleRatio * 100).toFixed(1)}% triple PASS`,
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
