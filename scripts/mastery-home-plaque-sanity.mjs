import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const panel = readFileSync(resolve('src/runtime/MasteryRequirementPanel.ts'), 'utf8');
const row = readFileSync(resolve('src/runtime/MasteryRequirementRowPanel.ts'), 'utf8');

if (!panel.includes('createSlateSurface(scene, x, y, width, height)')) {
  throw new Error('Mastery requirements must use the shared scalable slate surface.');
}
if (!row.includes('createQuietInset(scene, {')) {
  throw new Error('Mastery requirement rows must use shared quiet insets.');
}
if (panel.includes('createSoftStonePanel') || row.includes('scene.load.image(')) {
  throw new Error('Mastery requirements still depend on a legacy monolithic skin.');
}

console.info('[Dungeon Logic] Mastery surface sanity: PASS');
