
import fs from 'node:fs';

const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const primary = fs.readFileSync('src/runtime/PrimaryActionButton.ts', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  home.includes("import { createPrimaryActionButton } from '../runtime/PrimaryActionButton';"),
  'Home must use the primary renderer directly for its dedicated wide layout.',
);
assert(
  home.includes("homeWideLayout: true"),
  'Home primary action must opt into the wide-card content grid.',
);
assert(
  primary.includes("readonly homeWideLayout?: boolean;"),
  'Primary button API must expose the Home-only wide-card layout.',
);
assert(
  primary.includes("const iconX = options.x - options.width * (narrow ? 0.31 : 0.32);"),
  'Home primary play icon must use the same left slot as other wide Home cards.',
);
assert(
  primary.includes("const copyX = options.x - options.width * (narrow ? 0.16 : 0.18);"),
  'Home primary copy must start at the same column as other wide Home cards.',
);
assert(
  primary.includes("const homeIconSize = narrow ? 48 : 52;"),
  'Home primary play icon must be larger than the generic primary icon.',
);
assert(
  primary.includes("label.setOrigin(0, 0.5)") && primary.includes("subtitle.setOrigin(0, 0.5)"),
  'Home primary label and subtitle must share left alignment.',
);

console.log('[Dungeon Logic] Home primary wide layout sanity: PASS');
