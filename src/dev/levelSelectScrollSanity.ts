import { readFileSync } from 'node:fs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL('../scenes/LevelSelectScene.ts', import.meta.url), 'utf8');

assert(source.includes("from '../runtime/MetaPointerGate'"), 'Level Select must use MetaPointerGate for fresh-gesture ownership.');
assert(source.includes("from '../runtime/MetaScroll'"), 'Level Select must use the shared MetaScroll helpers.');
assert(source.includes('this.cameras.main.setScroll(0, 0)'), 'Level Select must reset camera scroll when created/restarted.');
assert(source.includes('setScrollFactor(0)'), 'Level Select header controls must stay fixed while cards scroll.');
assert(source.includes("this.input.on('wheel'"), 'Level Select must support wheel scrolling.');
assert(source.includes("this.input.on('pointermove'"), 'Level Select must support touch/pointer drag scrolling.');
assert(source.includes("this.input.on('pointerupoutside'"), 'Level Select must terminate drag gestures outside the canvas.');
assert(source.includes('isMetaScrollDrag('), 'Level Select must distinguish drag gestures from taps.');
assert(source.includes('shouldActivatePointer(pointer)'), 'Playable cards must gate activation after scrolling gestures.');
assert(source.includes('pointer.y < this.headerBottom'), 'Scrolled cards must not activate underneath the fixed header.');
assert(!source.includes(".on('pointerdown', () => {\n          void this.launchLevel"), 'Playable cards must not launch on pointerdown because drag starts there.');
assert(source.includes(".on('pointerup', (pointer: Phaser.Input.Pointer) =>"), 'Playable cards must activate on pointerup after drag filtering.');

console.info('[Dungeon Logic] Level Select scroll sanity: fixed header + wheel/touch drag + tap guard passed');
