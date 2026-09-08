export interface InterstitialState {
  readonly campaignCompletionsSinceOpportunity: number;
  readonly lastInterstitialAtMs: number | null;
}

export interface InterstitialEligibilityInput {
  readonly completedSlot: number;
  readonly state: InterstitialState;
  readonly nowMs: number;
}

export const INTERSTITIAL_COMPLETION_INTERVAL = 2;
export const INTERSTITIAL_COOLDOWN_MS = 4 * 60 * 1000;

export function isInterstitialEligible(input: InterstitialEligibilityInput): boolean {
  if (!Number.isFinite(input.nowMs)) return false;
  if (!Number.isInteger(input.completedSlot) || input.completedSlot <= 5) return false;
  if (
    !Number.isFinite(input.state.campaignCompletionsSinceOpportunity)
    || input.state.campaignCompletionsSinceOpportunity < INTERSTITIAL_COMPLETION_INTERVAL
  ) {
    return false;
  }

  const lastInterstitialAtMs = input.state.lastInterstitialAtMs;
  if (lastInterstitialAtMs === null) return true;
  if (!Number.isFinite(lastInterstitialAtMs)) return false;

  const elapsedMs = input.nowMs - lastInterstitialAtMs;
  return elapsedMs >= INTERSTITIAL_COOLDOWN_MS;
}
