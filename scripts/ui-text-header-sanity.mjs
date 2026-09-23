import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const text=readFileSync(resolve(root,'src/ui/UiText.ts'),'utf8');
const header=readFileSync(resolve(root,'src/ui/UiSceneHeader.ts'),'utf8');
assert(text.includes("export type UiTextRole = 'display' | 'heading' | 'bodyStrong' | 'body' | 'meta';"),'UiText roles must match the spec.');
assert(text.includes('UI_THEME.typography[role][density]'),'Text sizes must come from UiTheme.');
assert(text.includes(`fontFamily: "'Balsamiq Sans', sans-serif"`),'UI typography must use the Balsamiq Sans game font.');
assert(header.includes('createUiSceneHeader'),'Scene header primitive must exist.');
assert(header.includes('createUiSectionHeader'),'Section header primitive must exist.');
assert(header.includes('UI_THEME.colors.semantic.gold'),'Header decoration must use semantic gold.');
assert(header.includes('UI_THEME.colors.text.primary'),'Header title must use primary text.');
console.info('[Dungeon Logic] UI text + header sanity: PASS');
