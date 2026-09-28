import { decodeCloudPlayerProfile, encodeCloudPlayerProfile } from '../profile/CloudProfileCodec';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { DailyResultSummary, PlayerProfile } from '../profile/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function dateAt(startMs: number, offset: number): string {
  return new Date(startMs + offset * 86_400_000).toISOString().slice(0, 10);
}

function main(): void {
  const fresh = createFreshPlayerProfile([]);
  const startMs = Date.UTC(2026, 0, 1);
  const solvedDates: string[] = [];
  const results: Record<string, DailyResultSummary> = {};
  for (let index = 0; index < 7305; index += 1) {
    const date = dateAt(startMs, index);
    solvedDates.push(date);
    results[date] = {
      bestTimeMs: 20_000 + index * 17,
      minHintsUsed: index % 4,
      solvedWithoutHints: index % 4 === 0,
    };
  }

  const skipped = Array.from({ length: 100_000 }, (_, index) => index);
  const profile: PlayerProfile = {
    ...fresh,
    daily: {
      ...fresh.daily,
      currentStreak: 37,
      bestStreak: 91,
      lastSolvedDate: solvedDates.at(-1)!,
      totalSolved: solvedDates.length,
      solvedDates,
      results,
    },
    endless: {
      ...fresh.endless,
      nextFreshIndex: 100_000,
      completed: 0,
      skipped,
      freshSolvesSinceRetry: 7,
      currentStreak: 12,
      bestStreak: 55,
      freePlayOrdinal: 3,
    },
    mastery: { rating: 45678 },
    hints: { freeRemaining: 2, totalUsed: 345, rechargeAnchorMs: 1_800_000_000_000 },
    totals: { activePlayMs: 9_876_543_210 },
  };

  const encoded = encodeCloudPlayerProfile(profile);
  const bytes = new TextEncoder().encode(JSON.stringify(encoded)).byteLength;
  assert(bytes < 180_000, `Worst-case cloud profile stays below 180 KB safety budget (got ${bytes}).`);

  const decoded = decodeCloudPlayerProfile(encoded) as PlayerProfile;
  assert(decoded.schemaVersion === 1, 'Decoded compact profile restores the public profile schema.');
  assert(decoded.daily.solvedDates.length === 7305, 'All Daily solved dates survive compact round-trip.');
  assert(Object.keys(decoded.daily.results).length === 7305, 'All Daily result summaries survive compact round-trip.');
  assert(decoded.daily.results[solvedDates[4321]]?.bestTimeMs === results[solvedDates[4321]]?.bestTimeMs, 'Daily result timing survives compact round-trip.');
  assert(decoded.daily.results[solvedDates[4321]]?.minHintsUsed === results[solvedDates[4321]]?.minHintsUsed, 'Daily result hints survive compact round-trip.');
  assert(decoded.endless.skipped.length === skipped.length, 'Large Endless skipped queue survives compact round-trip.');
  assert(decoded.endless.skipped[12_345] === skipped[12_345], 'Endless skipped indices preserve exact membership/order.');
  assert(decoded.mastery.rating === profile.mastery.rating, 'Mastery state survives compact round-trip.');
  assert(decoded.hints.rechargeAnchorMs === profile.hints.rechargeAnchorMs, 'Hint recharge timestamp survives compact round-trip.');
  assert(decoded.totals.activePlayMs === profile.totals.activePlayMs, 'Lifetime active play survives compact round-trip.');

  const rotatedSkipped = [...skipped.slice(50_000), ...skipped.slice(0, 50_000)];
  const rotatedProfile: PlayerProfile = {
    ...profile,
    endless: {
      ...profile.endless,
      skipped: rotatedSkipped,
    },
  };
  const rotatedEncoded = encodeCloudPlayerProfile(rotatedProfile);
  const rotatedBytes = new TextEncoder().encode(JSON.stringify(rotatedEncoded)).byteLength;
  assert(rotatedBytes < 100_000, `Reachable rotated Endless retry queue stays comfortably below cloud budget (got ${rotatedBytes}).`);
  const rotatedDecoded = decodeCloudPlayerProfile(rotatedEncoded) as PlayerProfile;
  assert(rotatedDecoded.endless.skipped[0] === 50_000, 'Rotated Endless retry queue preserves its exact head.');
  assert(rotatedDecoded.endless.skipped.at(-1) === 49_999, 'Rotated Endless retry queue preserves cyclic order.');


  const puzzleCells = [['unknown', 'wall'], ['floor', 'unknown']] as const;
  const puzzleProfile: PlayerProfile = {
    ...fresh,
    tutorial: {
      completedLevelIds: ['tutorial-001'],
      completed: false,
      activePuzzle: { mode: 'tutorial', puzzleId: 'tutorial-002', cells: puzzleCells, activePlayMs: 123.5, hintsUsed: 1, startedAtMs: 1_800_000_000_001 },
    },
    campaign: {
      completedLevelIds: ['campaign-001'],
      lastPlayedLevelId: 'campaign-002',
      levelResults: { 'campaign-001': { bestTimeMs: 42_123.5, minHintsUsed: 2, solveCount: 3, solvedWithoutHints: true } },
      drafts: { 'campaign-002': { mode: 'campaign', puzzleId: 'campaign-002', cells: puzzleCells, activePlayMs: 12.25, hintsUsed: 2, startedAtMs: 1_800_000_000_002 } },
    },
    daily: {
      drafts: { '2026-02-02': { mode: 'daily', puzzleId: 'daily-2026-02-02', cells: puzzleCells, activePlayMs: 99, hintsUsed: 0, startedAtMs: 1_800_000_000_003 } },
      currentStreak: 2,
      bestStreak: 4,
      lastSolvedDate: '2026-02-01',
      totalSolved: 2,
      solvedDates: ['2026-01-31', '2026-02-01'],
      results: { '2026-02-01': { bestTimeMs: 55_000, minHintsUsed: 1, solvedWithoutHints: false } },
    },
    endless: {
      nextFreshIndex: 10,
      completed: 6,
      skipped: [4, 1, 9, 2],
      freshSolvesSinceRetry: 3,
      activeCatalogIndex: 4,
      activeKind: 'retry',
      activePuzzle: { mode: 'endless', puzzleId: 'endless-005', cells: puzzleCells, activePlayMs: 77, hintsUsed: 1, startedAtMs: 1_800_000_000_004 },
      currentStreak: 5,
      bestStreak: 8,
      freePlayOrdinal: 2,
    },
    mastery: { rating: 2222 },
    settings: { musicEnabled: false, soundEnabled: true, language: 'en' },
    hints: { freeRemaining: 1, totalUsed: 8, rechargeAnchorMs: 1_800_000_000_005 },
    totals: { activePlayMs: 123_456.75 },
  };
  const puzzleRoundTrip = decodeCloudPlayerProfile(encodeCloudPlayerProfile(puzzleProfile)) as PlayerProfile;
  assert(puzzleRoundTrip.tutorial.activePuzzle?.cells[0]?.[1] === 'wall', 'Tutorial puzzle cell packing round-trips.');
  assert(puzzleRoundTrip.campaign.drafts['campaign-002']?.activePlayMs === 12.25, 'Campaign draft timing round-trips without integer truncation.');
  assert(puzzleRoundTrip.campaign.levelResults['campaign-001']?.bestTimeMs === 42_123.5, 'Legacy Campaign fractional timing round-trips.');
  assert(puzzleRoundTrip.daily.drafts['2026-02-02']?.puzzleId === 'daily-2026-02-02', 'Daily draft round-trips.');
  assert(puzzleRoundTrip.daily.solvedDates.join(',') === '2026-01-31,2026-02-01', 'Solved-only Daily dates are preserved alongside result dates.');
  assert(puzzleRoundTrip.endless.skipped.join(',') === '4,1,9,2', 'Endless FIFO skip order survives signed-delta packing.');
  assert(puzzleRoundTrip.endless.activePuzzle?.cells[1]?.[0] === 'floor', 'Endless active puzzle round-trips.');
  assert(puzzleRoundTrip.settings.language === 'en' && !puzzleRoundTrip.settings.musicEnabled, 'Settings round-trip through compact cloud format.');
  assert(puzzleRoundTrip.totals.activePlayMs === 123_456.75, 'Fractional lifetime telemetry remains exact.');

  const legacy = { schemaVersion: 1, tutorial: {}, campaign: {}, daily: {}, endless: {}, settings: {}, hints: {}, totals: {} };
  assert(decodeCloudPlayerProfile(legacy) === legacy, 'Legacy/plain cloud profiles remain readable without conversion.');
  const arbitrary = { cloud: 'test' };
  assert(encodeCloudPlayerProfile(arbitrary) === arbitrary, 'Non-profile SDK test payloads pass through unchanged.');

  console.info(`[Dungeon Logic] Cloud profile codec sanity passed (${bytes} bytes worst-case fixture)`);
}

main();
