import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const boot = readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const selectors = readFileSync(new URL('../src/runtime/MetaSelectors.ts', import.meta.url), 'utf8');
assert(boot.includes('shouldAutoStartTutorial(profileService.getProfile())'), 'Fresh profiles still enter the tutorial.');
assert(boot.includes("this.scene.start('GameScene', createTutorialGameSceneData(started));"), 'Tutorial launch remains wired.');
assert(selectors.includes("| { readonly kind: 'locked' }") && selectors.includes("| { readonly kind: 'unavailable' }"), 'Daily state model keeps locked and unavailable.');
assert(home.includes("action.kind === 'locked'") && home.includes("action.kind === 'unavailable'"), 'Home displays locked and unavailable Daily separately.');
assert(home.includes('enabled: false'), 'Unavailable actions remain noninteractive.');
console.info('[Dungeon Logic] First-run Home state sanity: PASS');
