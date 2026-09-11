import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const audioService = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
const audioAssets = readFileSync(new URL('../src/audio/AudioAssets.ts', import.meta.url), 'utf8');
const homeButtons = readFileSync(new URL('../src/runtime/HomeMenuButton.ts', import.meta.url), 'utf8');
const metaHeader = readFileSync(new URL('../src/runtime/MetaPageHeader.ts', import.meta.url), 'utf8');
const levelSelect = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const cellView = readFileSync(new URL('../src/board/CellView.ts', import.meta.url), 'utf8');

assert(audioService.includes("| 'ui-hover'"), 'Audio feedback must expose a dedicated ui-hover event.');
assert(audioAssets.includes("uiHover: 'audio-ui-hover'"), 'Audio assets must preload a dedicated UI hover sound.');
assert(homeButtons.includes("play('ui-hover')"), 'Shared menu buttons must play hover feedback on pointerover.');
assert(metaHeader.includes("play('ui-hover')"), 'Meta back control must play hover feedback.');
assert(levelSelect.includes("play('ui-hover')"), 'Playable level cards must play hover feedback.');
assert(levelSelect.includes("play('ui-click')"), 'Launching a level must play UI click feedback.');
assert(!cellView.includes("play('ui-hover')"), 'Gameplay cells must stay silent on pointer hover.');

console.info('Audio v4 interaction sanity: PASS');
