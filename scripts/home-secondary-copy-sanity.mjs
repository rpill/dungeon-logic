import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const strip = readFileSync(new URL('../src/runtime/MasteryStrip.ts', import.meta.url), 'utf8');
assert(home.includes('subtitle: copy.levelSelect.progress(completedCampaign, levels.length)'), 'Levels progress remains live localized copy.');
assert(home.includes('copy.home.dailyLockedShort') && home.includes('copy.home.dailyUnavailableShort'), 'Daily locked and unavailable copy remains distinct.');
assert(home.includes('copy.home.dailyStreak') && home.includes('copy.home.dailySolvedShort'), 'Daily streak and solved copy remain data driven.');
assert(home.includes('copy.home.endlessFreePlay') && home.includes('copy.home.endlessLockedAfterLevel'), 'Challenge free play and locked copy remain distinct.');
assert(home.includes('fitHomeText(subtitle, textWidth, 10)'), 'Card secondary text fits variable RU/EN width.');
assert(strip.includes('fitTextWidth(subtitleText, contentWidth, 9)'), 'Rank secondary text fits variable RU/EN width.');
console.info('[Dungeon Logic] Home secondary copy sanity: PASS');
