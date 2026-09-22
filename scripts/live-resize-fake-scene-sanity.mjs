import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/dev/liveResizeSanity.ts', import.meta.url), 'utf8');
const fail = (message) => { throw new Error(message); };

for (const anchor of [
  'class FakeImage',
  'readonly images: FakeImage[] = [];',
  'image: (x: number, y: number, texture: string)',
  'readonly tweens = {',
  'readonly time = {',
  'scene.images.find((image) => image.interactive)',
]) {
  if (!source.includes(anchor)) fail(`liveResizeSanity fake scene is missing current BoardView support: ${anchor}`);
}
if (source.includes('scene.rectangles.find((rectangle) => rectangle.interactive)')) {
  fail('liveResizeSanity still looks for editable cells among rectangles instead of image-backed cells.');
}
console.info('[Dungeon Logic] Live-resize fake-scene sanity: PASS');
