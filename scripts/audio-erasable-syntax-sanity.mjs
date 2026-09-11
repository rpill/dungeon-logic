import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  !/constructor\s*\(\s*(?:private|public|protected)\b/.test(source),
  'AudioFeedbackService must not use TypeScript parameter properties when erasableSyntaxOnly is enabled.',
);
assert(
  source.includes('private readonly scene: Phaser.Scene;'),
  'AudioFeedbackService must declare scene as an ordinary class field.',
);
assert(
  source.includes('constructor(scene: Phaser.Scene)') && source.includes('this.scene = scene;'),
  'AudioFeedbackService constructor must assign the ordinary scene field.',
);

console.info('Audio erasable syntax sanity: PASS');
