import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const panel = fs.readFileSync(path.join(root, 'src/runtime/MasteryRequirementPanel.ts'), 'utf8');
const stone = fs.readFileSync(path.join(root, 'src/runtime/SoftStonePanel.ts'), 'utf8');
const mastery = fs.readFileSync(path.join(root, 'src/scenes/MasteryScene.ts'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(mastery.includes('createMasteryRequirementPanel'),'Mastery requirement shell must use its responsive stone panel.');
assert(panel.includes('createSoftStonePanel'),'Mastery and completion must share the finished stone panel asset.');
assert(stone.includes('soft_stone_panel_monolith.webp'),'Shared stone panel must load the single monolithic asset.');
assert(stone.includes('const SLICE_X = 200;') && stone.includes('const SLICE_Y = 160;'),'Stone panel must preserve the continuous rounded edges.');
assert(stone.includes('scene.add.nineslice('),'Stone panel must remain resizable via NineSlice.');
assert(!mastery.includes("variant: 'panel'"),'Mastery scene must stop using the old procedural panel variant for this block.');

console.info('[Dungeon Logic] Mastery panel asset sanity: PASS');
