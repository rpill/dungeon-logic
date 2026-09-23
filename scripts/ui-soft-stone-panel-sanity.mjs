import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const panel = fs.readFileSync(path.join(root, 'src/runtime/MasteryRequirementPanel.ts'), 'utf8');
const mastery = fs.readFileSync(path.join(root, 'src/scenes/MasteryScene.ts'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(mastery.includes('createMasteryRequirementPanel'),'Mastery requirement shell must use the dedicated mastery plaque asset.');
assert(panel.includes("assets/ui/mastery_requirements_panel_generated.png"),'Mastery requirement panel must load the generated stone plaque asset.');
assert(panel.includes('const SLICE_X = 120;') && panel.includes('const SLICE_Y = 120;'),'Mastery requirement panel must preserve wide corner slices when resized.');
assert(panel.includes('scene.add.nineslice('),'Mastery requirement shell must remain resizable via NineSlice.');
assert(!mastery.includes("variant: 'panel'"),'Mastery scene must stop using the old procedural panel variant for this block.');

console.info('[Dungeon Logic] Mastery panel asset sanity: PASS');
