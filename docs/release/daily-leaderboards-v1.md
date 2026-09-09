# Daily Leaderboard v1

The Daily competition uses **one permanent Yandex Games leaderboard** for the current Daily. Old Daily puzzles remain playable from the in-game archive, but archive completions are intentionally outside the ranking.

## Fair-result contract

- Only the Daily bound to the **trusted current UTC date** is ranked.
- Only the **first successful solve** for that date can be submitted.
- The ranked attempt starts from the trusted Yandex/server timestamp and survives leaving the puzzle or resetting its marks.
- Reset clears board marks but does not reset the ranked start timestamp.
- Ranked Daily has no hints. Undo remains available.
- Once the first result is stored, replays are practice-only and cannot replace or improve it.
- If a ranked attempt is finished after UTC midnight, the completion is preserved in the archive but is **not ranked** and does not extend the streak.
- Authorization is never opened implicitly. A guest may solve the Daily first and explicitly sign in from the leaderboard later to publish that already-fixed result.

## Yandex Console setup

Create exactly **one** leaderboard in the Yandex Games Developer Console:

- technical name: `daily`
- value/type: **numeric**
- ranking direction: **DESC / descending**

Do not create `daily_001`, `daily_002`, etc. New Daily dates require no new leaderboard setup.

## Why one numeric board works

The game packs two values into one safe integer score:

1. trusted UTC day ordinal in the high-order part;
2. inverted first-completion time in the low-order part.

That guarantees:

- every score from a newer Daily date is above every older date;
- within the same date, a faster completion has a larger score;
- the score can be decoded back into the original UTC date and completion time.

The UI decodes and filters the returned rows to the requested current Daily date. Because all current-day scores are above all older scores, Yandex's rank for a current-day player is also their rank among today's players.

## Daily archive

- Every released manifest Daily strictly before trusted today appears in the Daily archive.
- Archive entries are listed newest first.
- A player who starts the game weeks after release can still play every already-released Daily.
- The first archive completion time is saved permanently in the player profile and contributes to `totalSolved`.
- Archive completions never submit to `daily` and never modify `currentStreak`, `bestStreak`, or `lastSolvedDate`.
- Replaying a completed archive Daily is practice-only and does not replace its first stored time.
- Future manifest entries are hidden from playable archive state until their trusted UTC date has passed.

## Release checklist

1. Confirm exactly one Yandex leaderboard exists with technical name `daily`.
2. Confirm it is numeric and sorted DESC.
3. Solve today's Daily once as an authorized draft player and confirm the leaderboard shows the decoded first time and current-day place.
4. Reset/leave during an unsolved ranked Daily and confirm the trusted timer continues from the original attempt.
5. Reopen a solved current Daily and confirm it is practice-only and cannot replace the fixed result.
6. Open an older Daily from the archive, solve it, and confirm it is stored locally/profile-side but never submitted to the leaderboard.
7. Confirm solving an old archive Daily does not change the current/best streak or last on-time solved date.
8. Test a guest: opening the leaderboard must not trigger authorization until the player presses the explicit sign-in button.
