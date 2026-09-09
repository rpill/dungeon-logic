# Levels and Year Dailies Design

## Goal

Replace the manuscript/chapter campaign presentation with one simple 64-level mode named «УРОВНИ» / “LEVELS”, keep exactly three unsolved campaign levels available at a time, and ship one full year (365 days) of immutable Daily puzzles in the build.

## Product decisions

- The main campaign has no player-facing chapters, manuscripts, sealed volumes, chapter unlock messages, or archive terminology.
- The main campaign screen is named «УРОВНИ» / “LEVELS”.
- Campaign IDs remain `campaign-001` etc. Existing levels 1-30 keep their IDs and puzzle definitions so existing save data remains valid.
- The campaign contains exactly 64 levels.
- After Tutorial completion, the playable campaign frontier is the first three unsolved levels in slot order. Completed levels remain replayable. Solving any frontier level advances the frontier by one.
- `lastPlayedLevelId` only affects the Continue recommendation; it does not change unlock rules.
- Existing feature unlock timing remains: Daily and Statistics unlock after the first completion of `campaign-005`.
- Campaign contextual onboarding is removed; Tutorial v2 is the single rules-teaching flow.
- Daily Archive remains named Archive because it is explicitly historical Daily content.

## Campaign content

- Preserve campaign 1-30 byte-for-byte at the puzzle-definition level.
- Generate and curate campaign 31-64 using only the currently released mechanics: monster-only, chest-one-room, and mixed-one-room; no blockers or directional doors.
- Late campaign levels should remain human-solvable, uniquely solvable, quality-clean, structurally unique, and trend toward medium/hard difficulty.
- Generated campaign levels carry provenance with source candidate id/seed/archetype/difficulty for reproducibility.

## Daily content

- Daily calendar starts on `2026-09-09` and contains 365 consecutive trusted UTC dates through `2027-09-08` inclusive.
- Existing Daily 001-060 remain unchanged and keep their existing dates.
- Generate and curate Daily 061-365 from a deterministic independent reservoir.
- Runtime never generates a Daily puzzle. A trusted UTC date selects a static bundled snapshot.
- Daily snapshots must be unique by candidate id and structural wall fingerprint, must not collide with campaign structural fingerprints, must be uniquely/human solvable, and must pass release quality gates.
- Future game releases may replace only not-yet-live Daily snapshots when new mechanics are introduced; already-live dates should remain stable.

## UI and navigation

- Home campaign progress reads `Уровни · X / 64` / `Levels · X / 64`.
- Home routes campaign browsing to `LevelSelectScene`, not `ArchiveScene`.
- `LevelSelectScene` title is `УРОВНИ` / `LEVELS` and renders the full 64-slot list. Existing responsive column behavior remains for now; final visual design is deferred.
- Campaign completion returns to the Levels screen and no longer emits manuscript-unlocked messaging.
- Statistics show campaign solved count out of 64 and no manuscript completion metric.

## Compatibility

- Existing profile schema is retained unless removal of obsolete derived fields requires no persisted migration.
- Completed campaign IDs 1-30 remain recognized.
- Existing Daily results for dates 2026-09-09 through 2026-11-07 remain mapped to the same Daily IDs.
- Tutorial progress/migration behavior from Tutorial v2 is unchanged.

## Verification

- Campaign manifest sanity: exactly 64 contiguous IDs; levels 1-30 unchanged; all 64 validate, are unique, human-solvable, and quality-clean.
- Campaign unlock sanity: fresh campaign exposes 001/002/003; arbitrary completions maintain exactly the first three unsolved frontier plus completed replays; final completion leaves no unsolved frontier.
- Daily calendar sanity: exactly 365 consecutive UTC dates with start/end above and one snapshot per date.
- Daily corpus sanity: exactly 365 snapshots, no campaign collisions, no duplicate structural fingerprints/candidate IDs, all release gates pass.
- Localization/meta/stats/game-completion sanity updated to contain no player-facing manuscript campaign flow.
- Full TypeScript/build and release audit run when dependencies are available.
