export type LeaderboardDelay = (ms: number) => Promise<void>;
export type LeaderboardNow = () => number;

const defaultDelay: LeaderboardDelay = async (ms) => {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
};

/** Serializes Yandex leaderboard writes and enforces a start-to-start interval. */
export class LeaderboardSubmissionQueue {
  private readonly minIntervalMs: number;
  private readonly delay: LeaderboardDelay;
  private readonly now: LeaderboardNow;
  private tail: Promise<void> = Promise.resolve();
  private lastStartedAt: number | null = null;

  constructor(
    minIntervalMs = 1100,
    delay: LeaderboardDelay = defaultDelay,
    now: LeaderboardNow = () => Date.now(),
  ) {
    if (!Number.isFinite(minIntervalMs) || minIntervalMs < 0) {
      throw new Error('Leaderboard submit interval must be finite and non-negative.');
    }
    this.minIntervalMs = minIntervalMs;
    this.delay = delay;
    this.now = now;
  }

  enqueue<T>(submit: () => Promise<T>): Promise<T> {
    const run = this.tail.then(async () => {
      if (this.lastStartedAt !== null) {
        const elapsed = this.now() - this.lastStartedAt;
        const waitMs = Math.max(0, this.minIntervalMs - elapsed);
        if (waitMs > 0) await this.delay(waitMs);
      }
      this.lastStartedAt = this.now();
      return submit();
    });
    this.tail = run.then(() => undefined, () => undefined);
    return run;
  }
}
