import fs from 'node:fs';
const s=fs.readFileSync('src/scenes/HomeScene.ts','utf8');
if(!s.includes("options.icon === 'daily'")) throw new Error('Daily-specific icon sizing missing');
if(!s.includes('Math.min(106, cardWidth * 0.40)')) throw new Error('Desktop Daily icon size not enlarged');
console.log('[Dungeon Logic] Daily calendar icon size sanity: PASS');
