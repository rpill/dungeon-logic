import { readFileSync } from 'node:fs';
function assert(c,m){if(!c)throw new Error(m);}
const material=readFileSync('src/runtime/MaterialActionButton.ts','utf8');
const primary=readFileSync('src/runtime/PrimaryActionButton.ts','utf8');
const header=readFileSync('src/runtime/HeaderActionButton.ts','utf8');
assert(material.includes("MATERIAL_BUTTON_VISIBLE_FRAME_Y") && !material.includes('MATERIAL_BUTTON_VISUAL_HEIGHT_SCALE'), 'Material buttons must crop transparent vertical padding instead of faking equal height by overscaling the whole asset.');
assert(primary.includes("PRIMARY_BUTTON_VISIBLE_FRAME") && !primary.includes('PRIMARY_BUTTON_VISUAL_HEIGHT_SCALE'), 'Primary buttons must crop transparent vertical padding instead of overscaling the whole asset.');
assert(header.includes("HEADER_ACTION_SQUARE_VISIBLE_FRAME"), 'Square header buttons must render from a visible cropped frame so the artwork fills the square bounds.');
console.log('[Dungeon Logic] Button visible-frame sanity: PASS');
