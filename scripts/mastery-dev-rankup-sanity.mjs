import fs from 'node:fs';

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const devPath = 'src/dev/MasteryRankUpDevControl.ts';

expect(fs.existsSync(devPath), 'Dev-only Mastery rank-up control module must exist.');
expect(home.includes('if (import.meta.env.DEV && this.registry.get(\'visual-qa-active\') !== true)'), 'Home must guard the rank-up dev control and hide it in Visual QA.');
expect(home.includes("import('../dev/MasteryRankUpDevControl')"), 'Home must load the rank-up dev control through a dynamic import.');
expect(!home.includes("import { createMasteryRankUpDevControl } from '../dev/MasteryRankUpDevControl'"), 'Home must not statically import the dev-only rank-up control.');

if (fs.existsSync(devPath)) {
  const dev = fs.readFileSync(devPath, 'utf8');
  expect(dev.includes('showMasteryRankUpOverlay'), 'Dev control must invoke the real Mastery rank-up overlay.');
  expect(dev.includes('DEV RANK UP'), 'Dev control must expose a clearly marked dev-only button.');
}

console.info('[Dungeon Logic] Mastery dev rank-up sanity: PASS');
