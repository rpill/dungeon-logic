
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
  primary.includes("const PRIMARY_BUTTON_FRAME_X = 30;")
    && primary.includes("const PRIMARY_BUTTON_FRAME_Y = 6;")
    && primary.includes("const PRIMARY_BUTTON_FRAME_RIGHT = 31;")
    && primary.includes("const PRIMARY_BUTTON_FRAME_BOTTOM = 4;"),
  'Primary action must crop transparent texture margins before nine-slicing.',
);

assert(
  primary.includes("PRIMARY_BUTTON_FRAME_X,")
    && primary.includes("PRIMARY_BUTTON_FRAME_Y,")
    && primary.includes("source.width - PRIMARY_BUTTON_FRAME_X - PRIMARY_BUTTON_FRAME_RIGHT")
    && primary.includes("source.height - PRIMARY_BUTTON_FRAME_Y - PRIMARY_BUTTON_FRAME_BOTTOM"),
  'Primary button visible-bounds crop must be used when creating the texture frame.',
);

console.log('[Dungeon Logic] Home primary button proportion sanity: PASS');
