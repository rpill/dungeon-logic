function normalizeMs(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export class ActiveTimer {
  private elapsedMs: number;
  private runningSinceMs: number | null = null;

  constructor(initialElapsedMs = 0) {
    this.elapsedMs = normalizeMs(initialElapsedMs);
  }

  start(nowMs: number): void {
    if (this.runningSinceMs !== null) return;
    this.runningSinceMs = normalizeMs(nowMs);
  }

  pause(nowMs: number): void {
    if (this.runningSinceMs === null) return;
    const now = normalizeMs(nowMs);
    if (now > this.runningSinceMs) {
      this.elapsedMs += now - this.runningSinceMs;
    }
    this.runningSinceMs = null;
  }

  resume(nowMs: number): void {
    this.start(nowMs);
  }

  getElapsedMs(nowMs: number): number {
    if (this.runningSinceMs === null) return this.elapsedMs;
    const now = normalizeMs(nowMs);
    return now > this.runningSinceMs
      ? this.elapsedMs + (now - this.runningSinceMs)
      : this.elapsedMs;
  }

  isRunning(): boolean {
    return this.runningSinceMs !== null;
  }
}

export function formatActiveTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(normalizeMs(elapsedMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
