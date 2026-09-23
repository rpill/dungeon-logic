import fs from 'node:fs';

const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const mastery = fs.readFileSync('src/runtime/MasteryStrip.ts', 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(
  /const naturalMasteryHeight = naturalWideHeight;/.test(home),
  'Mastery and Challenge wide plaques use the same height.',
);
assert(
  !/UI_ICON_KEYS\.masteryForward/.test(home.slice(home.indexOf("if (options.variant === 'tall')"))),
  'Home wide mode cards have no forward arrow.',
);
assert(
  !/UI_ICON_KEYS\.masteryForward/.test(mastery),
  'Mastery strip has no forward arrow.',
);
assert(
  /const labelColor = enabled\s*\? UI_THEME\.colors\.text\.primary/.test(home),
  'Home mode headings use the primary text color instead of gold accent.',
);
assert(
  /fontSize: `\$\{narrow \? 18 : 22\}px`/.test(home),
  'Home mode headings use the larger approved size.',
);
assert(
  /setLetterSpacing\(narrow \? 1 : 1\.5\)/.test(home),
  'Home mode headings have deliberate letter spacing.',
);
assert(
  /fontFamily: "'Balsamiq Sans', sans-serif"/.test(mastery),
  'Mastery strip uses the same Balsamiq type family as other Home cards.',
);
assert(
  /setLetterSpacing\(narrow \? 1 : 1\.5\)/.test(mastery),
  'Mastery strip heading uses the same letter spacing.',
);

console.log('[Dungeon Logic] Home wide unification sanity: PASS');
