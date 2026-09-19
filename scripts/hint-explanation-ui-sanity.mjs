import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameScene = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const uiCopy = fs.readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

assert(
  gameScene.includes("from '../i18n/HintCopy'") && gameScene.includes('formatHintExplanation(language, currentHint)'),
  'GameScene must render the localized logical explanation for the current hint.',
);
assert(
  gameScene.includes('`${targetCopy}\\n${explanation}`') || gameScene.includes('`${hintTargetCopy}\\n${explanation}`'),
  'Hint status must show target plus explanation on separate lines.',
);
assert(
  uiCopy.includes("hintConfirmTitle: 'ПОКАЗАТЬ ПОДСКАЗКУ?'")
    && uiCopy.includes("hintConfirmTitle: 'SHOW A HINT?'"),
  'Hint confirmation copy must describe a hint, not a blind cell reveal.',
);
assert(
  !uiCopy.includes("hintConfirmTitle: 'ПОКАЗАТЬ ОДНУ КЛЕТКУ?'")
    && !uiCopy.includes("hintConfirmTitle: 'REVEAL ONE CELL?'"),
  'Old blind reveal confirmation wording must be removed.',
);

console.info('[Dungeon Logic] Hint explanation UI sanity: explanation + confirmation copy passed');
