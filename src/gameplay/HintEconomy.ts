export const MAX_FREE_HINTS = 3;
export const FREE_HINT_RECHARGE_MS = 30 * 60 * 1000;
export const RANKED_DAILY_HINT_UNLOCK_MS = 5 * 60 * 1000;

export interface HintRechargeState {
  readonly freeRemaining: number;
  readonly rechargeAnchorMs: number | null;
}

export interface HintRechargeStatus extends HintRechargeState {
  readonly nextRefillInMs: number | null;
}

function normalizeNow(nowMs: number): number {
  return Number.isFinite(nowMs) && nowMs >= 0 ? Math.floor(nowMs) : 0;
}

export function calculateHintRecharge(
  state: HintRechargeState,
  nowMs: number,
): HintRechargeStatus {
  const now = normalizeNow(nowMs);
  const freeRemaining = Math.max(0, Math.min(MAX_FREE_HINTS, Math.floor(state.freeRemaining)));
  if (freeRemaining >= MAX_FREE_HINTS) {
    return { freeRemaining: MAX_FREE_HINTS, rechargeAnchorMs: null, nextRefillInMs: null };
  }

  const anchor = state.rechargeAnchorMs === null
    || !Number.isFinite(state.rechargeAnchorMs)
    || state.rechargeAnchorMs < 0
    ? now
    : Math.floor(state.rechargeAnchorMs);
  const elapsed = Math.max(0, now - anchor);
  const gained = Math.floor(elapsed / FREE_HINT_RECHARGE_MS);
  const nextRemaining = Math.min(MAX_FREE_HINTS, freeRemaining + gained);

  if (nextRemaining >= MAX_FREE_HINTS) {
    return { freeRemaining: MAX_FREE_HINTS, rechargeAnchorMs: null, nextRefillInMs: null };
  }

  const nextAnchor = anchor + gained * FREE_HINT_RECHARGE_MS;
  return {
    freeRemaining: nextRemaining,
    rechargeAnchorMs: nextAnchor,
    nextRefillInMs: Math.max(0, FREE_HINT_RECHARGE_MS - (now - nextAnchor)),
  };
}

export function rankedDailyHintUnlockRemaining(elapsedMs: number): number {
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  return Math.max(0, RANKED_DAILY_HINT_UNLOCK_MS - safeElapsed);
}
