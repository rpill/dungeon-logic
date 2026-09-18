import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const campaignService = readFileSync(new URL('../src/campaign/CampaignService.ts', import.meta.url), 'utf8');
const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const levels = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');

assert(campaignService.includes('rowUnlock:'), 'Campaign completion must report a one-shot row unlock transition.');
assert(game.includes('result.rowUnlock'), 'Campaign Next must branch on row-unlock completion metadata.');
assert(game.includes("this.scene.start(LEVELS_SCENE_KEY, { rowUnlock: result.rowUnlock })"), 'Row completion Next must route to Levels with transition data.');
assert(levels.includes('playRowUnlockTransition'), 'Levels scene must animate a newly activated campaign row.');
assert(levels.includes('playMobileRowUnlockTransition'), 'Mobile paged Levels must animate the newly activated campaign page.');
assert(levels.includes('this.playMobileRowUnlockTransition(layout, visibleItems, rowUnlock, mobilePageStart);'), 'Mobile page must invoke its unlock wave after routing to the newly opened row.');
assert(levels.includes('createTemporaryUnlockCover'), 'Newly playable cards must visually shed temporary locks.');
assert(levels.includes('createRowDividerPulse'), 'The separator between campaign rows must pulse during unlock.');
assert(levels.includes('const ROW_UNLOCK_INITIAL_PAUSE_MS = 300;'), 'Row unlock must pause before the completion pulse so the transition is readable.');
assert(levels.includes('const ROW_UNLOCK_CARD_STAGGER_MS = 150;'), 'New-row locks must clear in a readable left-to-right wave.');
assert(levels.includes("play('campaign-unlock')"), 'Each disappearing campaign lock must play unlock feedback.');

assert(levels.includes('deferCurrentHighlight'), 'The newly opened current level must stay visually unlocked-white during the lock wave.');
assert(levels.includes('ROW_UNLOCK_CURRENT_REVEAL_DELAY_MS'), 'Current-level gold highlight must wait until every lock has disappeared.');
assert(levels.includes('revealCurrentLevelHighlight'), 'The new current level must receive its gold highlight only after the row is fully visible.');

assert(levels.includes('createCompletedRowGoldPulse'), 'Completed-row celebration must replace the normal completed styling with a temporary gold border/check pulse.');
assert(levels.includes('setTint(0xf0bd63)'), 'Completed-row celebration checkmarks must turn gold during the pulse.');
assert(levels.includes('ROW_UNLOCK_COMPLETED_CHECK_SCALE'), 'Completed-row celebration checkmarks must grow during the pulse.');
assert(levels.includes('drawCurrentGlow(card, strokeColor).setDepth(-1)'), 'Delayed current-level reveal must keep the glow behind the card so the card background stays dark.');

const audio = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
assert(audio.includes("| 'campaign-unlock'"), 'Audio feedback must expose a dedicated campaign-unlock event.');

console.info('[Dungeon Logic] Campaign row unlock transition sanity passed');
