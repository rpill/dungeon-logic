/**
 * Campaign is untimed now, so 0 is the sentinel written by new completions.
 * Preserve a positive legacy best time when it is merged with an untimed result.
 */
export function mergeLegacyCampaignBestTime(leftMs: number, rightMs: number): number {
  const leftTimed = Number.isFinite(leftMs) && leftMs > 0;
  const rightTimed = Number.isFinite(rightMs) && rightMs > 0;
  if (leftTimed && rightTimed) return Math.min(leftMs, rightMs);
  if (leftTimed) return leftMs;
  if (rightTimed) return rightMs;
  return 0;
}
