import {
  INTERSTITIAL_COMPLETION_INTERVAL,
  INTERSTITIAL_COOLDOWN_MS,
  isInterstitialEligible,
} from '../monetization/InterstitialPolicy';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function eligible(input: {
  completedSlot: number;
  completions: number;
  lastInterstitialAtMs: number | null;
  nowMs: number;
}): boolean {
  return isInterstitialEligible({
    completedSlot: input.completedSlot,
    state: {
      campaignCompletionsSinceOpportunity: input.completions,
      lastInterstitialAtMs: input.lastInterstitialAtMs,
    },
    nowMs: input.nowMs,
  });
}

function main(): void {
  assert(INTERSTITIAL_COMPLETION_INTERVAL === 2, 'Interstitial cadence is two post-onboarding campaign completions.');
  assert(INTERSTITIAL_COOLDOWN_MS === 4 * 60 * 1000, 'Interstitial cooldown is four minutes.');

  assert(!eligible({ completedSlot: 1, completions: 99, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'Level 001 is protected from interstitials.');
  assert(!eligible({ completedSlot: 5, completions: 99, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'Level 005 is protected from interstitials.');
  assert(!eligible({ completedSlot: 6, completions: 1, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'One post-onboarding completion is not enough.');
  assert(eligible({ completedSlot: 6, completions: 2, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'Two post-onboarding completions are eligible when there is no prior interstitial timestamp.');

  const last = 1_000_000;
  assert(!eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: last + INTERSTITIAL_COOLDOWN_MS - 1 }), 'Cooldown blocks one millisecond before four minutes.');
  assert(eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: last + INTERSTITIAL_COOLDOWN_MS }), 'Cooldown allows exactly at four minutes.');
  assert(!eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: last - 1 }), 'Clock rollback does not create an ad opportunity.');
  assert(!eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: Number.NaN }), 'Invalid current timestamp is ineligible.');

  console.info('[Dungeon Logic] Monetization sanity: pure interstitial eligibility policy passed');
}

main();
