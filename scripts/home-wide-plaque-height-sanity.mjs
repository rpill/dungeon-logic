import fs from 'node:fs';

const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const card = fs.readFileSync('src/runtime/HomeHubModeCard.ts', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(home.includes("const naturalWideHeight = narrow ? (compactHeight ? 88 : 100) : (compactHeight ? 100 : 116);"),
  'Home wide Challenge card uses the taller concept height.');
assert(home.includes('const naturalMasteryHeight = naturalWideHeight;'),
  'Home Mastery strip matches the Challenge plaque height.');
assert(/SOFT_SLICE_X[\s\S]*?wide:\s*129/.test(card), 'Wide soft-stone corners preserve their width.');
assert(/SOFT_SLICE_Y[\s\S]*?wide:\s*95/.test(card), 'Wide soft-stone corners preserve their height.');

console.log('[Dungeon Logic] Home wide plaque height sanity: PASS');
