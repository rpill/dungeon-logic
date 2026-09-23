import fs from 'node:fs';

const menu = fs.readFileSync('src/runtime/HomeMenuButton.ts', 'utf8');
const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');

if (!menu.includes("daily_calendar_star.webp")) throw new Error('Home daily icon must load the new calendar asset.');
if (menu.includes("scene.load.svg('home-menu-icon-daily'")) throw new Error('Legacy daily SVG preload must be removed.');
if (!home.includes("options.icon !== 'daily'")) throw new Error('Home Daily icon must bypass monochrome tinting.');

console.log('[Dungeon Logic] Daily calendar icon sanity: PASS');
