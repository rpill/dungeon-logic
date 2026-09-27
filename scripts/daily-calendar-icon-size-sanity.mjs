import fs from 'node:fs';
const s=fs.readFileSync('src/scenes/HomeScene.ts','utf8');
if(!s.includes('HOME_CARD_ICON_KEYS[options.icon]')) throw new Error('Home card icon mapping missing');
if(!s.includes('Math.min(narrow ? 45 : 54, options.height * 0.6)')) throw new Error('Responsive Home card icon sizing missing');
console.log('[Dungeon Logic] Daily calendar icon size sanity: PASS');
