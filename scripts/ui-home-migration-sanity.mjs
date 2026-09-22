import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition,message){if(!condition)throw new Error(message);}
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const home=readFileSync(resolve(root,'src/scenes/HomeScene.ts'),'utf8');
const strip=readFileSync(resolve(root,'src/runtime/MasteryStrip.ts'),'utf8');
assert(home.includes("from '../ui/UiTheme'"),'Home must consume shared theme tokens.');
assert(home.includes("from '../ui/UiDensity'"),'Home must consume shared density.');
assert(home.includes('createUiButton'),'Home primary CTA must use UiButton.');
assert(home.includes('createUiProgressBar'),'Home progress must use UiProgressBar directly.');
assert(strip.includes("from '../ui/UiTheme'"),'Mastery strip must use shared theme colors.');
assert(!home.includes("'#fff1d2'")&&!home.includes("'#c4d0e5'"),'Home standard text colors must not be hardcoded.');
console.info('[Dungeon Logic] Home UI migration sanity: PASS');
