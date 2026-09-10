import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameScene = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

assert(!copy.includes("hintRewarded: 'ПОДСКАЗКА ▶'"), 'RU rewarded hint label must not append a play triangle inside the toolbar button.');
assert(!copy.includes("hintRewarded: 'HINT ▶'"), 'EN rewarded hint label must not append a play triangle inside the toolbar button.');
assert(copy.includes('`Бесплатная подсказка через ${time}`'), 'RU recharge status must not end with a period.');
assert(copy.includes('`Free hint in ${time}`'), 'EN recharge status must not end with a period.');
assert(copy.includes("hintWall: 'Мигающая клетка — СТЕНА'"), 'RU wall hint status must not end with a period.');
assert(copy.includes("hintFloor: 'Мигающая клетка — ПОЛ'"), 'RU floor hint status must not end with a period.');

assert(gameScene.includes('const fitToolbarLabelToButton = ('), 'Toolbar must explicitly fit dynamic labels to the available button width.');
assert(gameScene.includes('fitToolbarLabelToButton(visual, width, iconSize, gap);'), 'Toolbar layout must apply label fitting after each label update.');
assert(gameScene.includes('createCenteredTextMenuButton(this, {'), 'Hint confirmation actions must reuse the themed menu-button renderer.');
assert(!gameScene.includes('const cancel = this.add.rectangle(cancelX, 0, buttonWidth, buttonHeight'), 'Hint confirmation must not use the old handmade rectangle cancel button.');
assert(!gameScene.includes('const confirm = this.add.rectangle(showX, 0, buttonWidth, buttonHeight'), 'Hint confirmation must not use the old handmade rectangle confirm button.');
assert(gameScene.includes("const hintConfirmTitle = this.add.text(0, -54"), 'Hint confirmation must render a dedicated title instead of reusing the generic status line.');
assert(gameScene.includes("const hintConfirmMeta = this.add.text(0, -28"), 'Hint confirmation must render a dedicated secondary line in the game visual language.');

console.info('[Dungeon Logic] Hint UI polish sanity: PASS');
