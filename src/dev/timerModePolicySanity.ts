import { readFileSync } from 'node:fs';

import { usesRunTimer } from '../gameplay/TimerModePolicy.ts';
import { calculateGameBoardLayout } from '../scenes/GameBoardLayout.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(!usesRunTimer('campaign'), 'Campaign must not expose or run the gameplay timer.');
assert(!usesRunTimer('tutorial'), 'Tutorial must not expose or run the gameplay timer.');
assert(!usesRunTimer('dev'), 'Developer puzzle launches must not expose or run the gameplay timer.');
assert(usesRunTimer('daily'), 'Daily must keep the gameplay timer.');
assert(usesRunTimer('endless'), 'Trials/Endless must keep the gameplay timer.');

const timedLayout = calculateGameBoardLayout(390, 844, 6, 6, true, false, true);
const untimedLayout = calculateGameBoardLayout(390, 844, 6, 6, true, false, false);
assert(untimedLayout.originY < timedLayout.originY, 'Untimed Campaign/Tutorial reclaim the hidden timer-panel space above the board.');

const gameScene = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
const boardLayout = readFileSync(new URL('../scenes/GameBoardLayout.ts', import.meta.url), 'utf8');
assert(gameScene.includes('const runTimerEnabled = usesRunTimer(launchData.context.mode);'), 'GameScene must apply the shared timer policy to every launch mode.');
assert(gameScene.includes('.setDepth(10).setVisible(runTimerEnabled);'), 'Untimed modes must hide the header timer/status panel.');
assert(gameScene.includes('runTimerEnabled && internalGameplayMayRun()'), 'Timer activity must remain independent from GameplayAPI eligibility.');
assert(gameScene.includes('bestTimeMs: runTimerEnabled'), 'Untimed Campaign/Tutorial completions must not accumulate gameplay time.');
assert(boardLayout.includes('showStatusPanel = true'), 'Board layout must support reclaiming timer-panel space in untimed modes.');

console.info('[Dungeon Logic] Timer mode policy sanity: timer is Daily/Trials only');
