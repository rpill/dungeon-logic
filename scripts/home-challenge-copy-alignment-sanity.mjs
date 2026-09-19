import fs from 'node:fs';
const home = fs.readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(home.includes('const contentLeft ='), 'Wide Home card must define one shared left text anchor.');
const wideStart = home.indexOf("if (options.variant === 'tall')");
const wide = home.slice(wideStart);
const leftOrigins = (wide.match(/\.setOrigin\(0, 0\.5\)/g) ?? []).length;
assert(leftOrigins >= 2, 'Wide Home card title and subtitle must both use the same left-origin alignment.');
console.info('[Dungeon Logic] Home Challenge copy alignment sanity: PASS');
