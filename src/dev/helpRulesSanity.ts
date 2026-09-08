import { HELP_RULES } from '../help/HelpRules';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const ids = HELP_RULES.map((rule) => rule.id);
assert(ids.includes('goal'), 'Help must explain the goal.');
assert(ids.includes('clues'), 'Help must explain row/column clues.');
assert(ids.includes('connectivity'), 'Help must explain connected open space.');
assert(ids.includes('open-2x2'), 'Help must explain the open 2x2 restriction.');
assert(ids.includes('monsters'), 'Help must explain monster dead ends.');
assert(ids.includes('treasure-room'), 'Help must explain treasure rooms.');
assert(ids.includes('controls'), 'Help must explain controls.');

const twoByTwo = HELP_RULES.find((rule) => rule.id === 'open-2x2');
assert(twoByTwo !== undefined, '2x2 rule exists.');
assert(twoByTwo.body.toLowerCase().includes('вне комнаты'), '2x2 rule must state the treasure-room exception.');
assert(twoByTwo.body.includes('2×2'), '2x2 rule must name the exact shape.');

const connectivity = HELP_RULES.find((rule) => rule.id === 'connectivity');
assert(connectivity !== undefined, 'Connectivity rule exists.');
assert(connectivity.body.includes('одну общую область'), 'Help must explain open-space connectivity.');
assert(connectivity.body.includes('Диагональ'), 'Connectivity rule must say diagonals do not connect.');

const monsters = HELP_RULES.find((rule) => rule.id === 'monsters');
assert(monsters !== undefined, 'Monster rule exists.');
assert(monsters.body.includes('ровно один'), 'Monster rule must state exactly one orthogonal open neighbor.');
assert(monsters.body.includes('любой тупик'), 'Monster rule must state the converse: every hallway dead end has a monster.');

const room = HELP_RULES.find((rule) => rule.id === 'treasure-room');
assert(room !== undefined, 'Treasure-room rule exists.');
assert(room.body.includes('3×3'), 'Treasure room must be exactly 3x3.');
assert(room.body.includes('ровно один вход'), 'Treasure room must have exactly one entrance.');
assert(room.body.includes('ровно один сундук'), 'Treasure room must contain exactly one chest.');

console.info('[Dungeon Logic] Help rules sanity: player-facing core rules passed');
