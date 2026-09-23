import fs from 'node:fs';

const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const primary = fs.readFileSync('src/runtime/PrimaryActionButton.ts', 'utf8');
const mastery = fs.readFileSync('src/runtime/MasteryStrip.ts', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  home.includes("subtitle: copy.levelSelect.progress(completedCampaign, levels.length),")
    && !home.includes("progress: { completed: completedCampaign"),
  'Levels Home card must show campaign progress as plain subtitle copy, not a progress bar.',
);
assert(
  !home.includes("createUiProgressBar") && !home.includes("function drawHomeCardProgress"),
  'Home must no longer create the Levels progress bar.',
);
assert(
  home.includes("const HOME_SUBTITLE_FONT_SIZE = narrow ? 12 : 14;")
    && home.split("fontSize: `${HOME_SUBTITLE_FONT_SIZE}px`,").length - 1 >= 2,
  'Tall and wide Home card secondary copy must be slightly larger.',
);
assert(
  primary.includes("const subtitleFontSize = homeWideLayout")
    && primary.includes("? (narrow ? 12 : 14)"),
  'Home primary button secondary copy must use the larger Home subtitle size.',
);
assert(
  mastery.includes("fontSize: `${narrow ? 12 : 14}px`,"),
  'Mastery strip secondary copy must match the larger Home subtitle size.',
);

console.log('[Dungeon Logic] Home secondary copy sanity: PASS');
