import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readWavHeader(path) {
  const data = readFileSync(path);
  assert(data.toString('ascii', 0, 4) === 'RIFF', `${path}: missing RIFF header`);
  assert(data.toString('ascii', 8, 12) === 'WAVE', `${path}: missing WAVE header`);
  let offset = 12;
  let fmt = null;
  let dataBytes = null;
  while (offset + 8 <= data.length) {
    const id = data.toString('ascii', offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ') {
      fmt = {
        audioFormat: data.readUInt16LE(start),
        channels: data.readUInt16LE(start + 2),
        sampleRate: data.readUInt32LE(start + 4),
        bitsPerSample: data.readUInt16LE(start + 14),
      };
    } else if (id === 'data') {
      dataBytes = size;
    }
    offset = start + size + (size % 2);
  }
  assert(fmt !== null && dataBytes !== null, `${path}: incomplete WAV`);
  return { ...fmt, dataBytes };
}

const audioFiles = [
  'ui-click.wav', 'marker-toggle.wav', 'wall-place.wav', 'wall-remove.wav', 'undo.wav',
  'reset.wav', 'hint.wav', 'error.wav', 'complete.wav',
];

for (const file of audioFiles) {
  const info = readWavHeader(join('public/assets/audio', file));
  assert(info.audioFormat === 1, `${file}: expected PCM WAV`);
  assert(info.sampleRate === 48000, `${file}: expected 48 kHz master, got ${info.sampleRate}`);
  assert(info.bitsPerSample === 16, `${file}: expected 16-bit PCM browser-safe asset`);
  assert(info.dataBytes > 2400, `${file}: audio payload is suspiciously tiny`);
}

const gameScene = readFileSync('src/scenes/GameScene.ts', 'utf8');
assert(!gameScene.includes("this.add.rectangle(cancelX, buttonY"), 'Reset modal must not use legacy rectangle cancel button.');
assert(!gameScene.includes("this.add.rectangle(resetX, buttonY"), 'Reset modal must not use legacy rectangle reset button.');
const resetBlockStart = gameScene.indexOf('const showResetDialog = (): void => {');
const resetBlockEnd = gameScene.indexOf('const requestReset = (): void => {', resetBlockStart);
assert(resetBlockStart >= 0 && resetBlockEnd > resetBlockStart, 'Could not locate reset dialog block.');
const resetBlock = gameScene.slice(resetBlockStart, resetBlockEnd);
const styledButtonCalls = resetBlock.match(/createCenteredTextMenuButton\(this,/g) ?? [];
assert(styledButtonCalls.length >= 2, 'Reset modal should use two styled menu buttons.');
assert(resetBlock.includes('createSlateSurface(this, 0, 0, width, height)'), 'Reset modal panel should use the current slate surface asset.');
assert(resetBlock.includes("variant: 'danger'"), 'Reset confirm keeps the unified danger button variant.');

console.info('Audio v2 + reset modal sanity: PASS');
