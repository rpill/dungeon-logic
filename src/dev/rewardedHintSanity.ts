import { requestHint } from '../gameplay/HintService';
import { AnalyticsService, type AnalyticsPuzzleContext } from '../analytics/AnalyticsService';
import { NOOP_ANALYTICS_TRANSPORT } from '../analytics/AnalyticsTransport';
import { MonetizationService } from '../monetization/MonetizationService';
import type { AdsPort, InterstitialResult, RewardedResult } from '../platform/services';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState } from '../puzzle/types';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { createPuzzleToolbarState } from '../runtime/PuzzleUiState';
import type { CampaignLevelEntry } from '../content/campaign/types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const TEST_MANIFEST: readonly CampaignLevelEntry[] = [{
  slot: 1,
  id: 'campaign-001',
  level: {
    id: 'campaign-001',
    width: 1,
    height: 1,
    rowClues: [0],
    columnClues: [0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: ['.'],
  } as CampaignLevelEntry['level'],
}];

class MemoryStorage implements PlayerProfileStorage {
  async load(): Promise<unknown | null> { return null; }
  async save(): Promise<void> {}
}

class FakeAds implements AdsPort {
  rewardedCalls = 0;
  result: RewardedResult = 'unavailable';
  rejectNext = false;

  async showInterstitial(): Promise<InterstitialResult> { return 'unavailable'; }
  async showRewarded(): Promise<RewardedResult> {
    this.rewardedCalls += 1;
    if (this.rejectNext) {
      this.rejectNext = false;
      throw new Error('rewarded failed');
    }
    return this.result;
  }
}

async function main(): Promise<void> {
  const profile = await PlayerProfileService.create(
    TEST_MANIFEST,
    new MemoryStorage(),
    { saveDelayMs: 60_000 },
  );
  profile.consumeFreeHint();
  profile.consumeFreeHint();
  profile.consumeFreeHint();
  assert(profile.getFreeHintsRemaining() === 0, 'Fixture exhausts the three free hints.');
  const hintEconomy = profile as unknown as {
    getHintRechargeStatus?: (nowMs: number) => { freeRemaining: number; nextRefillInMs: number | null };
  };
  assert(typeof hintEconomy.getHintRechargeStatus === 'function', 'Profile exposes timed free-hint recharge status.');
  const exhaustedAt = 1_000_000;
  const timedProfile = await PlayerProfileService.create(
    TEST_MANIFEST,
    new MemoryStorage(),
    { saveDelayMs: 60_000 },
  );
  timedProfile.consumeFreeHint(exhaustedAt);
  timedProfile.consumeFreeHint(exhaustedAt);
  timedProfile.consumeFreeHint(exhaustedAt);
  const timedEconomy = timedProfile as unknown as {
    getHintRechargeStatus: (nowMs: number) => { freeRemaining: number; nextRefillInMs: number | null };
  };
  assert(timedEconomy.getHintRechargeStatus(exhaustedAt).freeRemaining === 0, 'All three timed hints can be exhausted.');
  assert(timedEconomy.getHintRechargeStatus(exhaustedAt + 29 * 60_000).freeRemaining === 0, 'No free hint returns before 30 minutes.');
  assert(timedEconomy.getHintRechargeStatus(exhaustedAt + 30 * 60_000).freeRemaining === 1, 'One free hint returns after 30 minutes.');
  assert(timedEconomy.getHintRechargeStatus(exhaustedAt + 90 * 60_000).freeRemaining === 3, 'Timed recharge caps at three free hints.');
  await timedProfile.flush();

  let freeAdCalls = 0;
  let freeDeliveries = 0;
  const freePuzzle = new PuzzleState(TEST_MANIFEST[0].level);
  const freeResult = await requestHint({
    puzzle: freePuzzle,
    consumeFreeHint: () => true,
    requestRewarded: async () => {
      freeAdCalls += 1;
      return 'rewarded';
    },
    recordRewardedHintUsed: () => {
      throw new Error('Free hint must not record rewarded usage.');
    },
    deliverHint: () => {
      freeDeliveries += 1;
    },
  });
  assert(freeResult === 'delivered', 'Free request delivers immediately.');
  assert(freeAdCalls === 0, 'Free hint path never requests rewarded ads.');
  assert(freeDeliveries === 1, 'Free hint path delivers exactly one hint.');

  let rewardedUsage = 0;
  let rewardedDeliveries = 0;
  const rewardedPuzzle = new PuzzleState(TEST_MANIFEST[0].level);
  const rewardedResult = await requestHint({
    puzzle: rewardedPuzzle,
    consumeFreeHint: () => false,
    requestRewarded: async () => 'rewarded',
    recordRewardedHintUsed: () => {
      rewardedUsage += 1;
    },
    deliverHint: () => {
      rewardedDeliveries += 1;
    },
  });
  assert(rewardedResult === 'delivered', 'Rewarded result delivers one hint.');
  assert(rewardedUsage === 1 && rewardedDeliveries === 1, 'Rewarded delivery accounts exactly once.');

  const closedResult = await requestHint({
    puzzle: new PuzzleState(TEST_MANIFEST[0].level),
    consumeFreeHint: () => false,
    requestRewarded: async () => 'closed',
    recordRewardedHintUsed: () => { throw new Error('Closed ad must not record usage.'); },
    deliverHint: () => { throw new Error('Closed ad must not deliver.'); },
  });
  assert(closedResult === 'cancelled', 'Closed rewarded ad maps to cancelled.');

  const unavailableResult = await requestHint({
    puzzle: new PuzzleState(TEST_MANIFEST[0].level),
    consumeFreeHint: () => false,
    requestRewarded: async () => 'unavailable',
    recordRewardedHintUsed: () => { throw new Error('Unavailable ad must not record usage.'); },
    deliverHint: () => { throw new Error('Unavailable ad must not deliver.'); },
  });
  assert(unavailableResult === 'unavailable', 'Unavailable rewarded ad maps to unavailable.');

  const solvedPuzzle = new PuzzleState(TEST_MANIFEST[0].level);
  solvedPuzzle.setCellState(0, 0, CellState.Floor);
  const noneResult = await requestHint({
    puzzle: solvedPuzzle,
    consumeFreeHint: () => { throw new Error('Solved puzzle must not consume a free hint.'); },
    requestRewarded: async () => { throw new Error('Solved puzzle must not request ads.'); },
    recordRewardedHintUsed: () => { throw new Error('Solved puzzle must not record hint usage.'); },
    deliverHint: () => { throw new Error('Solved puzzle must not deliver a hint.'); },
  });
  assert(noneResult === 'none', 'Puzzle with no unresolved cell returns none.');

  const ads = new FakeAds();
  const analytics = new AnalyticsService(NOOP_ANALYTICS_TRANSPORT);
  const rewardedContext: AnalyticsPuzzleContext = { mode: 'campaign', puzzleId: 'campaign-001', slot: 1 };
  const monetization = MonetizationService.create(profile, ads, analytics);
  const totalBefore = profile.getProfile().hints.totalUsed;

  ads.result = 'rewarded';
  assert(await monetization.requestRewardedHint(rewardedContext) === 'rewarded', 'rewarded result is preserved.');
  assert(ads.rewardedCalls === 1, 'Explicit request calls rewarded ads exactly once.');
  assert(profile.getFreeHintsRemaining() === 0, 'Rewarded permission does not refill free hints.');
  assert(profile.getProfile().hints.totalUsed === totalBefore, 'Ad completion alone is not a delivered hint.');

  profile.recordRewardedHintUsed();
  assert(profile.getProfile().hints.totalUsed === totalBefore + 1, 'Delivered rewarded hint increments totalUsed once.');
  assert(profile.getFreeHintsRemaining() === 0, 'Delivered rewarded hint still does not refill free hints.');

  ads.result = 'closed';
  assert(await monetization.requestRewardedHint(rewardedContext) === 'closed', 'closed result is preserved.');
  ads.result = 'unavailable';
  assert(await monetization.requestRewardedHint(rewardedContext) === 'unavailable', 'unavailable result is preserved.');
  ads.rejectNext = true;
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert(await monetization.requestRewardedHint(rewardedContext) === 'unavailable', 'rejected ad promise maps to unavailable.');
  } finally {
    console.warn = warn;
  }

  const free = createPuzzleToolbarState('wall', false, false, 2, true)
    .buttons.find((button) => button.id === 'hint');
  assert(free?.label === 'HINT ×2' && !free.disabled, 'Free hint UI remains unchanged while hints remain.');

  const noAds = createPuzzleToolbarState('wall', false, false, 0, false)
    .buttons.find((button) => button.id === 'hint');
  assert(noAds?.label === 'HINT' && noAds.disabled, 'Zero-hint local fallback stays disabled.');

  const rewarded = createPuzzleToolbarState('wall', false, false, 0, true)
    .buttons.find((button) => button.id === 'hint');
  assert(rewarded?.label === 'HINT ▶' && !rewarded.disabled, 'Zero-hint rewarded path becomes an explicit ad action.');

  await profile.flush();
  console.info('[Dungeon Logic] Rewarded hint sanity: service + accounting + toolbar policy passed');
}

void main();
