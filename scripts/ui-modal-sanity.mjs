import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const modal=readFileSync(resolve(root,'src/ui/UiModal.ts'),'utf8');
assert(modal.includes("variant: 'compact' | 'tall'"),'UiModal must expose compact/tall semantics.');
assert(modal.includes('UI_THEME.colors.background.overlay'),'Modal veil must use the shared overlay token.');
assert(modal.includes('contentBounds'),'Modal must expose visible content bounds.');
assert(modal.includes("options.density === 'mobile' ? 12 : options.density === 'compact' ? 16 : 24"),'Modal padding must follow the shared density scale.');
console.info('[Dungeon Logic] UI modal sanity: PASS');
