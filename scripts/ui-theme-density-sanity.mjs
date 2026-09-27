import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const themePath = resolve(root, 'src/ui/UiTheme.ts');
const densityPath = resolve(root, 'src/ui/UiDensity.ts');
const theme = readFileSync(themePath, 'utf8');
const density = readFileSync(densityPath, 'utf8');
for (const token of ['0x0d1127','0x121d3a','0x070b19','0x0f2039','0x1b2a4d','0x2f4b69','0x3c5887','0x18314f','0x536c94','0x7894ba','0xf8f1da','0xcbd3e0','0x8e9bb4','0xaab6ca','0xefb146','0xeec358','0x71cdb8','0xc86672','0xe7954b']) assert(theme.toLowerCase().includes(token), `UiTheme must contain ${token}.`);
assert(theme.includes('spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }'), 'UiTheme must expose the approved spacing scale.');
assert(theme.includes("meta: { comfortable: 12, compact: 11, mobile: 10 }"), 'Meta typography must respect the 10px floor.');
assert(density.includes("export type UiDensity = 'comfortable' | 'compact' | 'mobile';"), 'Density type must have exactly three modes.');
assert(density.includes('viewportWidth < 700 && viewportHeight >= viewportWidth'), 'Portrait phone detection must be explicit.');
assert(density.includes('viewportHeight <= 800'), 'Low desktop must resolve through the shared compact threshold.');
const mod = await import(pathToFileURL(densityPath).href);
for (const [w,h,expected] of [[1920,1080,'comfortable'],[1920,800,'compact'],[1920,650,'compact'],[390,844,'mobile'],[430,932,'mobile']]) assert(mod.resolveUiDensity(w,h) === expected, `${w}x${h}: density mismatch`);
console.info('[Dungeon Logic] UI theme + density sanity: PASS');
