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
  assert(data && channels > 0 && sampleRate > 0 && bits === 16, `${path} must be 16-bit PCM WAV`);
  const samples = new Float64Array(data.length / 2 / channels);
  for (let frame = 0; frame < samples.length; frame += 1) {
    let mixed = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      mixed += data.readInt16LE((frame * channels + channel) * 2) / 32768;
    }
    samples[frame] = mixed / channels;
  }
  return { samples, sampleRate, duration: samples.length / sampleRate };
}

function rms(audio) {
  let sum = 0;
  for (const sample of audio.samples) sum += sample * sample;
  return Math.sqrt(sum / Math.max(1, audio.samples.length));
}

function zeroCrossingRate(audio) {
  let crossings = 0;
  for (let i = 1; i < audio.samples.length; i += 1) {
    if ((audio.samples[i - 1] < 0) !== (audio.samples[i] < 0)) crossings += 1;
  }
  return crossings / Math.max(1, audio.samples.length - 1);
}

const click = readPcm16Wav(resolve('public/assets/audio/ui-click.wav'));
assert(click.duration >= 0.09 && click.duration <= 0.22, `ui-click.wav should preserve the clean one-shot body (90–220ms); got ${click.duration.toFixed(3)}s`);

const complete = readPcm16Wav(resolve('public/assets/audio/complete.wav'));
assert(complete.duration >= 1.45 && complete.duration <= 2.35, `complete.wav should be a richer 1.45–2.35s victory phrase; got ${complete.duration.toFixed(3)}s`);
assert(zeroCrossingRate(complete) >= 0.035, `complete.wav should contain a brighter/richer harmonic layer; zero-crossing rate=${zeroCrossingRate(complete).toFixed(4)}`);
assert(rms(complete) <= 0.12, `complete.wav must stay controlled in loudness; rms=${rms(complete).toFixed(4)}`);

const readme = readFileSync(resolve('public/assets/audio/README.md'), 'utf8');
assert(readme.includes('User-selected Mixkit sources'), 'README must document the user-selected source assets.');

console.info('Audio v7 user-sample sanity: PASS');
