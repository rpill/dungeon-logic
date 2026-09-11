import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readPcm16Wav(path) {
  const buffer = readFileSync(path);
  assert(buffer.toString('ascii', 0, 4) === 'RIFF', `${path} must be RIFF`);
  assert(buffer.toString('ascii', 8, 12) === 'WAVE', `${path} must be WAVE`);
  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bits = 0;
  let data = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ') {
      channels = buffer.readUInt16LE(start + 2);
      sampleRate = buffer.readUInt32LE(start + 4);
      bits = buffer.readUInt16LE(start + 14);
    } else if (id === 'data') {
      data = buffer.subarray(start, start + size);
      break;
    }
    offset = start + size + (size % 2);
  }
  assert(data && sampleRate > 0 && bits === 16, `${path} must be 16-bit PCM WAV`);
  let sumSq = 0;
  let count = 0;
  for (let i = 0; i + 1 < data.length; i += 2) {
    const sample = data.readInt16LE(i) / 32768;
    sumSq += sample * sample;
    count += 1;
  }
  const rms = Math.sqrt(sumSq / Math.max(1, count));
  const duration = data.length / (sampleRate * channels * (bits / 8));
  return { rms, duration };
}

const service = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
assert(/'ui-hover':[\s\S]*?volume:\s*0\.0(?:2|3)/.test(service), 'UI hover must be very quiet (0.02–0.03).');
assert(/'marker-toggle':[\s\S]*?volume:\s*0\.0(?:4|5|6)/.test(service), 'Marker toggle must be quieter (0.04–0.06).');

const wallPlace = readPcm16Wav(resolve('public/assets/audio/wall-place.wav'));
const wallRemove = readPcm16Wav(resolve('public/assets/audio/wall-remove.wav'));
const complete = readPcm16Wav(resolve('public/assets/audio/complete.wav'));
const deltaDb = 20 * Math.log10(Math.max(wallRemove.rms, 1e-9) / Math.max(wallPlace.rms, 1e-9));
assert(Math.abs(deltaDb) <= 2.0, `wall-remove RMS must be within ±2 dB of wall-place; got ${deltaDb.toFixed(2)} dB`);
assert(complete.duration >= 0.8 && complete.duration <= 2.35, `complete.wav must be 0.8–2.35s; got ${complete.duration.toFixed(3)}s`);

console.info('Audio v5 polish sanity: PASS');
