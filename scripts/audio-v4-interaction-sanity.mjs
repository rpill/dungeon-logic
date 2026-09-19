import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function collectTypeScriptFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectTypeScriptFiles(path));
    else if (extname(entry.name) === '.ts') files.push(path);
  }
  return files;
}

const audioService = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
const audioAssets = readFileSync(new URL('../src/audio/AudioAssets.ts', import.meta.url), 'utf8');
const levelSelect = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const sourceFiles = collectTypeScriptFiles('src');
const hoverReferences = sourceFiles.filter((path) => readFileSync(path, 'utf8').includes('ui-hover'));

assert(!audioService.includes("| 'ui-hover'"), 'Audio feedback must not expose a ui-hover event.');
assert(!audioAssets.includes("uiHover: 'audio-ui-hover'"), 'Audio assets must not preload a UI hover sound.');
assert(hoverReferences.length === 0, `UI hover audio references must be removed from src; found: ${hoverReferences.join(', ')}`);
assert(!existsSync('public/assets/audio/ui-hover.wav'), 'Unused ui-hover.wav must be removed.');
assert(levelSelect.includes("play('ui-click')"), 'Launching a level must keep UI click feedback.');

console.info('Audio v4 interaction sanity: PASS');
