import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition,message){if(!condition)throw new Error(message);}
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mastery=readFileSync(resolve(root,'src/scenes/MasteryScene.ts'),'utf8');
assert(mastery.includes('createUiSceneHeader'),'Mastery must use the shared scene header.');
assert(mastery.includes('createMasteryRequirementPanel'),'Mastery must use its responsive stone requirement shell.');
const requirementPanel=readFileSync(resolve(root,'src/runtime/MasteryRequirementPanel.ts'),'utf8');
assert(requirementPanel.includes('createSlateSurface'),'Mastery requirement shell must use the shared matte slate surface.');
assert(mastery.includes('createMasteryRequirementRowPanel'),'Mastery requirement rows must use reusable runtime components.');
const row=readFileSync(resolve(root,'src/runtime/MasteryRequirementRowPanel.ts'),'utf8');
assert(row.includes('createQuietInset')&&!row.includes('mastery_requirement_row_monolith'),'Rows must use the runtime inset without a baked row PNG.');
assert(mastery.includes('createUiProgressBar'),'Mastery progress must use UiProgressBar.');
assert(mastery.includes('resolveUiDensity'),'Mastery styling must use shared density.');
console.info('[Dungeon Logic] Mastery UI migration sanity: PASS');
