
import fs from 'node:fs';

const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const primary = fs.readFileSync('src/runtime/PrimaryActionButton.ts', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  home.includes("const naturalPrimaryHeight = narrow ? (compactHeight ? 80 : 92) : (compactHeight ? 88 : 104);"),
  'Home primary action must be taller so it has comparable visual weight to the wide stone cards.',
);

assert(
  primary.includes("const PRIMARY_BUTTON_FULL_FRAME = 'button-body-full';")
    && primary.includes('preserveCanvasPadding: options.homeWideLayout === true'),
  'Home primary action must preserve its already-approved full-canvas treatment while standard buttons use the visible cropped frame.',
);

assert(
  !primary.includes('PRIMARY_BUTTON_FRAME_X') && !primary.includes('PRIMARY_BUTTON_FRAME_RIGHT'),
  'Primary action must not re-apply the legacy crop to the new tightly-trimmed asset.',
);

console.log('[Dungeon Logic] Home primary button proportion sanity: PASS');
