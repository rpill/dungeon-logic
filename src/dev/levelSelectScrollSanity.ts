import { readFileSync } from 'node:fs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL('../scenes/LevelSelectScene.ts', import.meta.url), 'utf8');

assert(source.includes("from '../runtime/MetaPointerGate'"), 'Level Select must use MetaPointerGate for fresh-gesture ownership.');
assert(source.includes("from '../runtime/MetaScroll'"), 'Level Select must use the shared MetaScroll helpers.');
assert(source.includes('this.cameras.main.setScroll(0, 0)'), 'Level Select must reset camera scroll when created/restarted.');
assert(!source.includes('headerScrim'), 'Level Select must not draw a fixed header underlay.');
assert(!source.includes('fixed: true'), 'Level Select header must scroll with the page content.');
assert(!source.includes('pinHomeMenuButton'), 'Level Select Continue button must scroll with the page content.');
assert(source.includes("this.input.on('wheel'"), 'Level Select must support wheel scrolling.');
assert(source.includes("this.input.on('pointermove'"), 'Level Select must support touch/pointer drag scrolling.');
assert(source.includes("this.input.on('pointerupoutside'"), 'Level Select must terminate drag gestures outside the canvas.');
assert(source.includes('isMetaScrollDrag('), 'Level Select must distinguish drag gestures from taps.');
assert(source.includes('shouldActivatePointer(pointer)'), 'Playable cards must gate activation after scrolling gestures.');
assert(!source.includes('pointer.y < this.headerBottom'), 'Scroll gestures may begin anywhere because the whole page scrolls together.');
assert(!source.includes(".on('pointerdown', () => {\n          void this.launchLevel"), 'Playable cards must not launch on pointerdown because drag starts there.');
assert(source.includes(".on('pointerup', (pointer: Phaser.Input.Pointer) =>"), 'Playable cards must activate on pointerup after drag filtering.');

console.info('[Dungeon Logic] Level Select scroll sanity: whole-page wheel/touch drag + tap guard passed');
