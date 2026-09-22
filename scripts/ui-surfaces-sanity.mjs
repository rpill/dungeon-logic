import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const panel=readFileSync(resolve(root,'src/ui/UiPanel.ts'),'utf8');
const inset=readFileSync(resolve(root,'src/ui/UiInsetRow.ts'),'utf8');
const badge=readFileSync(resolve(root,'src/ui/UiStatusBadge.ts'),'utf8');
assert(panel.includes("variant: 'wide' | 'tall'"),'UiPanel must expose only the approved shell shapes.');
assert(panel.includes('createHomeHubModeCard'),'UiPanel must reuse the approved Home surface family during the pilot.');
assert(inset.includes('UI_THEME.colors.surface.inset'),'Inset rows must use the shared inset token.');
assert(inset.includes('UI_THEME.colors.border.normal'),'Inset rows must use the shared normal border.');
assert(!inset.includes('load.image'),'Inset rows must be programmatic and asset-free.');
assert(badge.includes('createUiTextStyle'),'Status badges must use shared typography.');
console.info('[Dungeon Logic] UI surfaces sanity: PASS');
