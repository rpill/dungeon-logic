import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition,message){if(!condition)throw new Error(message);}
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const game=readFileSync(resolve(root,'src/scenes/GameScene.ts'),'utf8');
const header=readFileSync(resolve(root,'src/runtime/PuzzleHeaderUiAssets.ts'),'utf8');
assert(header.includes("from './SlateSurface'") && header.includes("from './QuietInset'")
  && header.includes('createSlateSurface(') && header.includes('createQuietInset('),
  'Puzzle header must use the approved shared slate title and quiet status surfaces.');
assert(game.includes("from '../ui/UiTheme'"),'Gameplay chrome must use shared semantic tokens.');
assert(game.includes('resolveUiDensity'),'Gameplay chrome must resolve shared density.');
assert(!game.includes('lineStyle(3, 0xf0bd63'),'Gameplay guidance highlight must not hardcode gold.');
console.info('[Dungeon Logic] Gameplay UI migration sanity: PASS');
