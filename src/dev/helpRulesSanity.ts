import { HELP_RULES, getHelpRules, getHelpUtilities } from '../help/HelpRules';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const expectedRuleIds = [
  'goal',
  'clues',
  'floor',
  'treasure-room',
  'monsters',
  'connectivity',
  'open-2x2',
  'completion',
] as const;

assert(HELP_RULES.length === 8, 'Help contains exactly eight puzzle-rule cards.');
assert(
  HELP_RULES.map((rule) => rule.id).join(',') === expectedRuleIds.join(','),
  'Puzzle rules follow Tutorial order: goal, clues, floor, room, monsters, connectivity, 2x2, completion.',
);

for (const language of ['ru', 'en'] as const) {
  const rules = getHelpRules(language);
  const utilities = getHelpUtilities(language);
  assert(rules.length === 8, `${language}: rules reference has eight puzzle cards.`);
  assert(
    rules.every((rule) => !['controls', 'feedback'].includes(rule.id as string)),
    `${language}: controls and feedback are not numbered puzzle rules.`,
  );
  assert(
    utilities.map((utility) => utility.id).join(',') === 'controls,feedback',
    `${language}: utility section contains controls then red-highlight feedback.`,
  );
}

const ruRules = getHelpRules('ru');
const enRules = getHelpRules('en');
const ruGoal = ruRules.find((rule) => rule.id === 'goal');
const enGoal = enRules.find((rule) => rule.id === 'goal');
assert(ruGoal?.body.includes('не обязательно') === true, 'RU goal says Floor is optional for victory.');
assert(enGoal?.body.toLowerCase().includes('not required') === true, 'EN goal says Floor is not required for victory.');

const ruFloor = ruRules.find((rule) => rule.id === 'floor');
assert(ruFloor?.body.includes('вспомогательная') === true, 'RU Floor card explicitly calls Floor a solving aid.');
const room = ruRules.find((rule) => rule.id === 'treasure-room');
assert(room?.body.includes('3×3') === true && room.body.includes('ровно один вход'), 'Room card states exact 3x3 size and one entrance.');
const monsters = ruRules.find((rule) => rule.id === 'monsters');
assert(monsters?.body.includes('ровно один') === true && monsters.body.includes('любой тупик'), 'Monster card states both directions of the dead-end rule.');
const connectivity = ruRules.find((rule) => rule.id === 'connectivity');
assert(connectivity?.body.toLowerCase().includes('диагональ') === true, 'Connectivity card says diagonals do not connect.');
const twoByTwo = ruRules.find((rule) => rule.id === 'open-2x2');
assert(twoByTwo?.body.includes('2×2') === true && twoByTwo.body.includes('Вне комнаты'), 'Corridor card states the outside-room 2x2 restriction.');
const completion = ruRules.find((rule) => rule.id === 'completion');
assert(completion?.body.includes('автоматически') === true && completion.body.includes('не нужно'), 'Completion card says correct walls auto-finish without marking all Floor.');

console.info('[Dungeon Logic] Help rules sanity: eight puzzle rules + separate controls/feedback section passed');
