import { CampaignRowUnlockGate } from '../runtime/CampaignRowUnlockGate';
import type { CampaignRowUnlockTransition } from '../campaign/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const rowTwo: CampaignRowUnlockTransition = {
  completedRowStartSlot: 1,
  completedRowEndSlot: 8,
  nextRowStartSlot: 9,
};

const rowThree: CampaignRowUnlockTransition = {
  completedRowStartSlot: 9,
  completedRowEndSlot: 16,
  nextRowStartSlot: 17,
};

const gate = new CampaignRowUnlockGate();

assert(gate.consume(null) === null, 'No transition stays empty.');
assert(gate.consume(rowTwo) === rowTwo, 'A newly unlocked row is consumed once.');
assert(gate.consume(rowTwo) === null, 'The same row unlock cannot replay on scene re-entry.');
assert(gate.consume(null) === null, 'Normal scene entry does not reset consumed unlock history.');
assert(gate.consume(rowTwo) === null, 'A stale row unlock stays suppressed after normal navigation.');
assert(gate.consume(rowThree) === rowThree, 'A later row unlock is still allowed.');
assert(gate.consume(rowThree) === null, 'The later row unlock is also one-shot.');

console.info('[Dungeon Logic] Campaign row unlock gate sanity: one-shot row transitions passed');
