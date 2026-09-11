import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');

function eventBlock(eventName, nextEventName) {
  const startToken = eventName.includes('-') ? `'${eventName}': {` : `${eventName}: {`;
  const start = source.indexOf(startToken);
  assert(start >= 0, `Missing FEEDBACK definition for ${eventName}.`);
  const nextToken = nextEventName === null
    ? '\n};\n\nconst SCENE_SERVICES'
    : (nextEventName.includes('-') ? `\n  '${nextEventName}': {` : `\n  ${nextEventName}: {`);
  const end = source.indexOf(nextToken, start + startToken.length);
  assert(end > start, `Could not isolate FEEDBACK definition for ${eventName}.`);
  return source.slice(start, end);
}

const events = [
  'ui-click',
  'ui-hover',
  'wall-place',
  'wall-remove',
  'marker-toggle',
  'undo',
  'reset',
  'hint',
  'error',
  'complete',
];

for (let index = 0; index < events.length; index += 1) {
  const event = events[index];
  const next = events[index + 1] ?? null;
  const block = eventBlock(event, next);
  const hasVibration = block.includes('vibration:');
  const shouldVibrate = event === 'error' || event === 'complete';
  assert(
    hasVibration === shouldVibrate,
    `${event} ${shouldVibrate ? 'must' : 'must not'} define vibration feedback.`,
  );
}

console.info('Vibration scope sanity: PASS');
