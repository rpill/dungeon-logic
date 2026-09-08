import { resolvePointerTool } from '../gameplay/PuzzlePointerPolicy.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(resolvePointerTool('floor', false, false) === 'wall', 'Mouse left button always maps to Wall.');
assert(resolvePointerTool('wall', false, true) === 'floor', 'Mouse right button always maps to Floor.');
assert(resolvePointerTool('floor', true, false) === 'floor', 'Touch keeps the selected Floor tool.');
assert(resolvePointerTool('wall', true, false) === 'wall', 'Touch keeps the selected Wall tool.');

console.info('[Dungeon Logic] Pointer policy sanity: desktop mouse buttons + touch selected tool passed');
