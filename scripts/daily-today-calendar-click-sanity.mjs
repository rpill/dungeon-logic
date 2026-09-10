import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const daily = readFileSync('src/scenes/DailyScene.ts', 'utf8');

assert(
  daily.includes("(day.state === 'today' || day.state === 'archive-unsolved' || day.state === 'archive-solved') && day.entry !== null"),
  'Today calendar cell must be playable just like archive Daily cells.',
);
assert(
  daily.includes('void this.launchDaily(day.entry!);'),
  'Playable Daily calendar cells must launch the selected Daily entry.',
);

console.info('[Dungeon Logic] Daily today calendar click sanity: PASS');
