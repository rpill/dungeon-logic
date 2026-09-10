import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync(new URL('../src/scenes/HelpScene.ts', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../src/help/HelpRules.ts', import.meta.url), 'utf8');
let illustrations = '';
try {
  illustrations = readFileSync(new URL('../src/help/HelpIllustrations.ts', import.meta.url), 'utf8');
} catch {}

assert(scene.includes("from '../help/HelpIllustrations'"), 'HelpScene must use the asset-based help illustration renderer.');
assert(!scene.includes('rule.diagram'), 'HelpScene must not render ASCII/text diagrams.');
assert(!rules.includes('readonly diagram?: string'), 'Help rules must no longer carry ASCII diagram strings.');
assert(illustrations.includes("'board-wall-01'"), 'Help illustrations must reuse the real wall asset.');
assert(illustrations.includes("'board-floor-01'"), 'Help illustrations must reuse the real floor asset.');
assert(illustrations.includes("'board-floor-mark'"), 'Help illustrations must reuse the real floor-mark asset.');
assert(illustrations.includes("'monster-pink-01'"), 'Help illustrations must reuse the real monster asset.');
assert(illustrations.includes("'board-chest-01'"), 'Help illustrations must reuse the real chest asset.');
assert(scene.includes('createCenteredTextMenuButton'), 'Help page must finish with the shared styled menu button.');
assert(scene.includes('0x1f2c4a'), 'Help rule cards must use the established blue meta-card palette.');

console.info('[Dungeon Logic] How-to-play visual sanity: asset diagrams + styled cards + shared CTA passed');
