import { MetaPointerGate } from '../runtime/MetaPointerGate.js';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gate = new MetaPointerGate();

assert(!gate.canActivate(1), 'A scene must reject pointerup for a pointerdown it never saw.');
gate.notePointerDown(1);
assert(gate.canActivate(1), 'A scene may activate after seeing the pointerdown itself.');
gate.reset();
assert(!gate.canActivate(1), 'Restarting/recreating the scene clears prior pointer ownership.');
gate.notePointerDown(2);
assert(!gate.canActivate(1), 'A different pointer id cannot inherit another pointer gesture.');
assert(gate.canActivate(2), 'The pointer id that began in this scene remains activatable.');

console.info('[Dungeon Logic] Meta pointer gate sanity: fresh-gesture ownership passed');
