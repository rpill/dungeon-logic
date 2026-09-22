import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const button=readFileSync(resolve(root,'src/ui/UiButton.ts'),'utf8');
const progress=readFileSync(resolve(root,'src/ui/UiProgressBar.ts'),'utf8');
const material=readFileSync(resolve(root,'src/runtime/MaterialActionButton.ts'),'utf8');
const legacyProgress=readFileSync(resolve(root,'src/runtime/MasteryProgressBar.ts'),'utf8');
assert(button.includes("export type UiButtonVariant = 'primary' | 'secondary' | 'danger';"),'UiButton must expose semantic variants only.');
assert(button.includes('createPrimaryActionButton')&&button.includes('createMaterialActionButton'),'UiButton must preserve approved button renderers.');
assert(progress.includes('UI_THEME.colors.semantic.gold')&&progress.includes('UI_THEME.colors.semantic.success'),'Progress must use theme gold/success.');
assert(material.includes("from '../ui/UiTheme'"),'Material buttons must consume shared theme tokens.');
assert(legacyProgress.includes('createUiProgressBar'),'Legacy Mastery progress helper must delegate to UiProgressBar.');
console.info('[Dungeon Logic] UI controls sanity: PASS');
