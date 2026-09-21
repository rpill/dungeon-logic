import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const modal = readFileSync(resolve(root, 'src/runtime/ModalPanel.ts'), 'utf8');
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const resetStart = game.indexOf('const showResetDialog = (): void =>');
const resetEnd = game.indexOf('const requestReset = (): void =>', resetStart);
const resetDialog = game.slice(resetStart, resetEnd);

assert(
  modal.includes("wide: { x: 3, y: 141, width: 892, height: 416 }")
    && modal.includes("tall: { x: 73, y: 46, width: 652, height: 931 }"),
  'ModalPanel must crop generated transparent margins before nine-slicing.',
);
assert(
  modal.includes('texture.add(frameKey, 0, frame.x, frame.y, frame.width, frame.height)'),
  'ModalPanel must create a trimmed texture frame.',
);
assert(
  !resetDialog.includes('const shadow = this.add.graphics();\n      shadow.fillStyle(0x050a13, 0.42);'),
  'Reset dialog must not keep the legacy oversized shadow behind the modal asset.',
);

console.info('[Dungeon Logic] modal visible bounds sanity: PASS');
