# Single Daily Leaderboard + Archive Design

## Goal
Replace the per-Daily Yandex leaderboard scheme with one permanent leaderboard and make every already-released Daily playable from an archive.

## Ranked Daily model
- Exactly one Yandex leaderboard exists: `daily`.
- Only the Daily whose `dateKey` equals the trusted current UTC date is ranked.
- Only the first successful completion for that date can become the ranked result.
- Replays after a result exists are practice-only and never submit a score.
- If an attempt crosses UTC midnight before completion, the completion is preserved as an archive completion but is not ranked and does not extend the streak.
- Ranked Daily has no Hint; Undo remains allowed.
- Reset clears cells but does not reset ranked elapsed time.

## Single-score encoding
Yandex keeps one score per player per leaderboard, so each submitted score must make a newer day outrank every older day while keeping faster times higher within the same day.

Use:
- `DAILY_LEADERBOARD_NAME = "daily"`
- a fixed positive score span large enough for a Daily time budget
- an integer UTC day ordinal in the high-order component
- inverted completion time in the low-order component

The decoder must recover the UTC date and elapsed milliseconds from the score. Leaderboard UI filters out rows whose decoded date does not equal the requested current Daily date. Because every score for the current day is greater than every score for prior days, Yandex rank for a current-day entry is also its rank within the current day.

## Archive model
- All manifest entries strictly earlier than trusted today are archive entries.
- Today is handled as the live Daily, not duplicated in the archive list.
- Future entries are not playable and do not appear in the archive list.
- Archive entries can be played in any order.
- First archive completion time is stored permanently in the existing profile `daily.results[dateKey]` map and contributes to `totalSolved`.
- Archive attempts and completions never submit to Yandex leaderboard.
- Archive completions never alter `currentStreak`, `bestStreak`, or `lastSolvedDate`.
- Replaying an already-completed archive entry is allowed as practice but never replaces its first stored result.

## Daily entry UX
The Home Daily entry becomes a gateway to a dedicated Daily screen rather than directly launching the puzzle. The Daily screen shows:
1. Today card: play/resume if unsolved; leaderboard if solved.
2. Archive summary and a scrollable list of all released past Daily entries, newest first.
3. Each archive row shows date and either `NOT SOLVED` or the stored first completion time.
4. Selecting an unsolved archive row launches it unranked; selecting a solved row can replay it explicitly as practice.

After an archive completion the result screen says that the Daily was completed from the archive and is outside the rating.

## Profile compatibility
No schema bump is required. Existing `results`, `solvedDates`, and `totalSolved` already represent per-date completion history. The behavior of streak fields changes only for future archive completions; existing persisted streak values are preserved and normalized as before.

## Release setup
`docs/release/daily-leaderboards-v1.md` must describe creating only one Yandex leaderboard named `daily`, numeric score, descending order. The old `daily_001`…`daily_060` setup is removed.
