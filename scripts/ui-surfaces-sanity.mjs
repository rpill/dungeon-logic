import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const panel=readFileSync(resolve(root,'src/ui/UiPanel.ts'),'utf8');
const inset=readFileSync(resolve(root,'src/ui/UiInsetRow.ts'),'utf8');
const badge=readFileSync(resolve(root,'src/ui/UiStatusBadge.ts'),'utf8');
assert(panel.includes("export type UiPanelVariant = 'wide' | 'tall' | 'panel'"),'UiPanel must expose the approved shell shapes, including the soft-stone panel.');
assert(panel.includes('createHomeHubModeCard'),'Wide/tall UiPanel variants must keep the approved Home surface family.');
assert(panel.includes("options.variant === 'panel'") && panel.includes('scene.add.graphics()'),'Panel UiPanel variant must be the procedural soft-stone shell.');
assert(inset.includes('UI_THEME.colors.surface.inset'),'Inset rows must use the shared inset token.');
assert(inset.includes('UI_THEME.colors.border.normal'),'Inset rows must use the shared normal border.');
assert(!inset.includes('load.image'),'Inset rows must be programmatic and asset-free.');
assert(badge.includes('createUiTextStyle'),'Status badges must use shared typography.');
console.info('[Dungeon Logic] UI surfaces sanity: PASS');
