import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const layoutPath = resolve(root, 'src/runtime/MasteryDesktopLayout.ts');
const scene = readFileSync(resolve(root, 'src/scenes/MasteryScene.ts'), 'utf8');
assert(existsSync(layoutPath), 'Adaptive mastery desktop layout calculator must exist.');
assert(!scene.includes('shortDesktop'), 'MasteryScene must not use a fixed short-desktop breakpoint.');
assert(scene.includes('calculateMasteryDesktopLayout'), 'MasteryScene must use the adaptive desktop layout calculator.');
console.info('[Dungeon Logic] Mastery short desktop sanity: PASS');
