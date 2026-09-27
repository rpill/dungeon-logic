import { readFileSync } from 'node:fs';

function assert(condition, message) { if (!condition) throw new Error(message); }
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');

assert(home.includes('createPrimaryActionButton'), 'Continue remains the shared gold action button.');
assert(home.includes('createSlateSurface'), 'Home hero and navigation use the shared slate material.');
assert(home.includes('createMasteryStrip'), 'Home retains the live rank/progress card.');
assert(home.includes('const navPosition ='), 'Home lays out desktop columns and phone rows from one action list.');
assert(home.includes('contentViewport.height / naturalStackHeight'), 'Short viewports scale the complete stack without clipping.');
assert(home.includes('STICKY_BOTTOM_INSET_REGISTRY_KEY'), 'Home reserves the platform sticky area.');
assert(home.includes('getHomeDailyAction(profile, today)'), 'Daily card derives its state from live data.');
assert(home.includes("action.kind === 'locked'") && home.includes("action.kind === 'unavailable'") && home.includes("action.kind === 'solved'"),
  'Daily locked, unavailable and solved paths remain explicit.');
assert(home.includes('enabled: endlessUnlocked'), 'Challenge stays locked until campaign unlock.');
assert(home.includes('endlessProgress.rankedComplete'), 'Challenge free play copy remains data driven.');
assert(!home.includes('createHomeHubModeCard'), 'Legacy Home card skins are no longer used.');

console.info('[Dungeon Logic] Home hub layout sanity: approved composition and live states passed');
