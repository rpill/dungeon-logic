import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition,message){if(!condition)throw new Error(message);}
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mastery=readFileSync(resolve(root,'src/scenes/MasteryScene.ts'),'utf8');
assert(mastery.includes('createUiSceneHeader'),'Mastery must use the shared scene header.');
assert(mastery.includes('createUiPanel'),'Mastery main requirement shell must use UiPanel.');
assert(mastery.includes('createUiInsetRow'),'Mastery requirement rows must use programmatic inset rows.');
assert(mastery.includes('createUiProgressBar'),'Mastery progress must use UiProgressBar.');
assert(mastery.includes('resolveUiDensity'),'Mastery styling must use shared density.');
assert(!mastery.includes('createMasteryRequirementRowPanel'),'Mastery must stop using a separate decorative row family.');
console.info('[Dungeon Logic] Mastery UI migration sanity: PASS');
