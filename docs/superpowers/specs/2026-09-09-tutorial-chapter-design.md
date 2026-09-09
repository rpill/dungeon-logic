# Tutorial Chapter Design

## Goal

Replace the current campaign-embedded onboarding with a dedicated tutorial chapter that teaches the game through four small, fully guided puzzles, while keeping the existing 30-level campaign intact and ensuring that puzzle completion depends on correctly placed walls rather than explicitly marking every remaining cell as floor.

## Problem Being Solved

The current onboarding is attached to early campaign levels and can continue asking the player to mark FLOOR cells even after all required walls are correctly placed. This conflicts with the actual puzzle validator, which treats any cell that is not a wall as open and can therefore solve a puzzle while editable cells remain `Unknown`.

The current structure also mixes two different responsibilities:

- onboarding is trying to teach mechanics;
- the first campaign chapter is trying to provide normal campaign progression.

That makes the opening levels longer than necessary and prevents a clean boundary between “the game is teaching me” and “I am now solving the campaign myself.”

## Product Decision

Create a dedicated Tutorial chapter before Campaign Chapter I.

- Tutorial is separate from the existing 30 campaign levels.
- Existing campaign IDs, slots, chapters, curation data, level order, statistics, and completion records remain unchanged.
- A fresh player must finish the Tutorial before normal Campaign is unlocked.
- After Tutorial completion, Tutorial remains permanently available for replay.
- Existing players with meaningful campaign activity must not be forced backwards into the Tutorial. Migration treats a legacy profile as Tutorial-complete when it has any completed Campaign level, a non-null Campaign `lastPlayedLevelId`, or a persisted active Campaign puzzle.
- Daily mode remains independent and is not gated by Tutorial completion.

## Tutorial Structure

The Tutorial contains four purpose-built levels rather than reusing `campaign-001` through `campaign-005`.

### Tutorial 1 — Row and Column Clues

Target size: approximately 4×4.

Teach:

- row clues;
- column clues;
- placing walls;
- the basic win condition.

The player is guided through every required wall placement until the puzzle validates as solved.

No FLOOR action is required for completion.

### Tutorial 2 — Monsters and Dead Ends

Target size: approximately 5×5.

Teach:

- a monster occupies open floor;
- every monster must be at a corridor dead end;
- a corridor dead end must contain a monster;
- combine this rule with row/column counts.

The player is guided through every required wall placement until the puzzle validates as solved.

### Tutorial 3 — Connectivity and the Open 2×2 Rule

Target size: approximately 5×5.

Teach:

- all non-wall cells belong to one connected open area;
- a fully open 2×2 corridor block is forbidden;
- rules must be combined rather than read in isolation.

The player is still guided through the whole puzzle. Campaign, not Tutorial 3, is where independent solving begins.

### Tutorial 4 — Treasure Room

Target size: approximately 6×6.

Teach:

- the chest belongs to a fully open 3×3 treasure room;
- the room has exactly one entrance;
- the room is an exception to the normal open-2×2 restriction;
- combine treasure-room logic with all previously taught rules.

The player is guided through all required wall placements until solved.

After completion, show a blocking completion message equivalent to:

- RU: `ОБУЧЕНИЕ ПРОЙДЕНО` and a clear action to start Chapter I;
- EN: `TUTORIAL COMPLETE` and a clear action to start Chapter I.

This is a lightweight functional transition. Full chapter celebration visuals, animations, music, and victory polish remain out of scope for this task.

## Completion Semantics

The canonical completion rule is the existing puzzle validator:

```ts
validatePuzzle(puzzle).isSolved === true
```

Tutorial progression must never introduce a stronger completion condition than the core game.

Specifically:

- Tutorial steps target required WALL placements.
- Tutorial may reference open cells, monsters, clues, or rooms in explanatory copy.
- Tutorial must not require the player to convert all remaining `Unknown` cells to `Floor`.
- `Floor` is an optional solving annotation, not part of the win requirement.
- As soon as the final required wall is placed and the validator reports `isSolved`, the tutorial level completes immediately.

If a tutorial explanation needs to demonstrate that a cell is known to be open, it must explain the deduction without requiring a FLOOR input. Visual focus may point at the cell, but there is no mandatory “mark this as floor” step.

## Floor Tool and Rules Copy

The FLOOR tool stays in the game because it is useful as player notation.

The Help/Rules goal copy changes from “mark every editable cell as WALL or FLOOR” to wording with these semantics:

### Russian

`Расставь стены так, чтобы все правила подземелья выполнялись одновременно. Известный пол можно отмечать для удобства решения, но это не требуется для завершения уровня.`

### English

`Place walls so all dungeon rules are satisfied at the same time. You may mark known floor cells as a solving aid, but floor marks are not required to finish a level.`

Controls continue to explain how to place FLOOR marks, but must describe them as optional notation rather than a required state.

## Tutorial Interaction Model

Tutorial is fully guided.

For each step:

- the tutorial message explains one deduction;
- only the intended wall cell or intended group of wall cells is accepted as the guided action;
- player still performs the action manually;
- after the intended action is satisfied, Tutorial advances to the next deduction;
- if the puzzle becomes solved on that action, solve completion wins over any remaining tutorial step and the level ends.

Long tutorial messages never auto-dismiss and always close only when the player clicks/taps the message panel. Their gameplay-blocking policy is explicit per message:

- read-before-play intro messages are blocking: board/toolbar input is disabled and the active timer is paused until the panel is clicked;
- handoff/reminder messages whose meaning is “continue solving while this stays visible” are non-blocking: board, tools, Undo/Hint where otherwise legal, and the active timer continue normally while the panel remains visible;
- a persistent non-blocking message must not become modal merely because it requires an explicit click to dismiss.

Tutorial message panels are informational only: they never pause the timer, disable the board, or disable controls. There is intentionally no `allowInput` switch on message steps, so a future tutorial copy change cannot accidentally reintroduce modal gameplay blocking.

No tutorial overlay may use red unless there is an actual gameplay contradiction. Red stays reserved for error/conflict feedback.

## Navigation and Unlock Flow

### Fresh Profile

Home/Campaign entry flow resolves to Tutorial first.

Expected path:

`Home → Tutorial 1 → Tutorial 2 → Tutorial 3 → Tutorial 4 → Tutorial Complete → Campaign Chapter I / Level 1`

The Campaign level-select screen must communicate that Campaign is locked until Tutorial is completed and provide a direct `Обучение` / `Tutorial` action.

### Tutorial Replay

Once completed:

- Tutorial remains visible from the campaign/meta UI;
- all four tutorial levels are replayable;
- replaying or resetting Tutorial does not relock Campaign;
- replay results do not affect campaign level statistics.

### Existing Profiles

To preserve current players:

- if a legacy stored profile has one or more completed Campaign levels, a non-null Campaign `lastPlayedLevelId`, or a persisted active Campaign puzzle, Tutorial is considered completed during migration;
- existing `completedLevelIds`, `levelResults`, and campaign active state are preserved;
- no existing campaign ID or slot is renumbered.

A legacy profile with no Campaign completion, no `lastPlayedLevelId`, and no active Campaign puzzle remains subject to the Tutorial gate.

## Persistence Model

Tutorial progress belongs to the player profile but is separate from Campaign progress.

Add a tutorial section with these semantics:

```ts
tutorial: {
  completedLevelIds: readonly string[];
  completed: boolean;
  activePuzzle: SerializedPuzzleState | null; // when non-null, mode === 'tutorial'
}
```

Tutorial active-puzzle persistence reuses `SerializedPuzzleState`; its `mode` union is extended to `campaign | daily | tutorial`, and the Tutorial profile section accepts only records whose mode is `tutorial`. Campaign active-puzzle normalization continues to accept only `campaign`, and Daily state remains unchanged.

Tutorial IDs are fixed and stable:

- `tutorial-001`
- `tutorial-002`
- `tutorial-003`
- `tutorial-004`

The player profile schema is bumped from v1 to v2. `PlayerProfileV2` adds the Tutorial section while preserving the existing Campaign, Daily, settings, hints, ads, and totals fields. `normalizePlayerProfile` must accept both schema v1 and schema v2 inputs and always return a normalized v2 profile.

The serialized active-puzzle mode union is extended to include `tutorial`. Tutorial active puzzles store their stable tutorial ID and use the same cell/timer/hint payload shape as Campaign and Daily. Migration from v1 preserves every existing Campaign/Daily field and marks Tutorial complete when legacy Campaign activity exists as defined above; otherwise it creates an untouched Tutorial state.

## Runtime Architecture

Tutorial is a first-class gameplay launch context rather than a fake Campaign entry.

`GameLaunchContext` gains a tutorial mode containing a tutorial level ID.

GameScene continues to own the common board, timer, reset, settings, help, and solve presentation. Mode-specific completion delegates to a Tutorial service, analogous to the existing Campaign and Daily completion ports.

The dedicated tutorial content should live outside `src/content/campaign` so campaign curation and release tooling still describe exactly 30 campaign levels.

Suggested boundaries:

- `src/content/tutorial/` — four tutorial level definitions and tutorial manifest;
- `src/tutorial/` — tutorial progress/unlock/service logic;
- `src/onboarding/` — guided step definitions and sequencing for tutorial IDs only;
- `src/runtime/GameLaunch.ts` — construct tutorial GameScene data;
- `src/scenes/GameScene.ts` — mode-agnostic gameplay plus tutorial completion dispatch;
- meta scenes — expose Tutorial entry and Campaign gate.

The old `campaign-001…005` contextual onboarding mappings are removed. Campaign starts as normal gameplay with no guided overlay.

## Campaign Integrity

The existing campaign remains exactly 30 levels.

The following must remain stable:

- campaign IDs `campaign-001` through `campaign-030`;
- campaign slot numbers 1 through 30;
- chapter ranges and themes;
- campaign completion/statistics data;
- manuscript/unlock logic except for the new prerequisite that Tutorial must be complete before a fresh player enters Campaign;
- Daily content and Daily progress.

Tutorial levels are not included in campaign curation reports, campaign difficulty corpus requirements, chapter level counts, or Campaign statistics.

## Failure and Edge Cases

- Resetting a tutorial level restarts that tutorial level from a clean board and its first guided step.
- Leaving Tutorial mid-level persists the active board/timer/hint state and resumes the same tutorial level. Guided-step position is reconstructed from the board state by advancing past already-satisfied wall steps, so a separate persisted step counter is not required.
- Opening Settings or Rules from Tutorial must pause gameplay and return to the same tutorial level and tutorial step.
- Language changes while Tutorial is active must preserve tutorial progress and reload the corresponding localized copy.
- Completing Tutorial 4 twice must remain idempotent and must never relock Campaign.
- A solved board must complete even if optional FLOOR marks remain absent.

## Testing Requirements

Add regression coverage before implementation changes.

At minimum, tests/sanity gates must prove:

1. Tutorial manifest contains exactly four stable tutorial IDs and does not alter the 30-level Campaign manifest.
2. A fresh profile cannot enter normal Campaign before Tutorial completion.
3. Legacy profiles with Campaign completion, a non-null Campaign last-played ID, or an active Campaign puzzle are migrated as Tutorial-complete; untouched legacy profiles are not.
4. Completing Tutorial 4 unlocks Campaign Chapter I permanently.
5. Tutorial replay does not relock Campaign or write Campaign level results.
6. Tutorial guided steps never require `CellState.Floor`.
7. Every tutorial level can reach `validatePuzzle(...).isSolved` by placing only its required walls, leaving other editable cells `Unknown`.
8. GameScene finishes a tutorial level immediately when the validator reports solved, regardless of remaining optional onboarding metadata.
9. The Help/Rules goal copy states that FLOOR is optional in both RU and EN.
10. Long blocking tutorial messages require explicit click/tap dismissal and do not auto-dismiss.
11. Tutorial overlays do not use red instructional highlighting.
12. Campaign levels 1–30 launch with no old contextual onboarding.
13. Settings/Rules round trips preserve active Tutorial state.
14. Existing campaign, profile, localization, board visual, hint, daily, and release sanity gates remain green.

## Out of Scope

This task does not implement:

- monster completion animations;
- chest-opening animation;
- final art or audio;
- full Chapter Complete presentation for the four normal Campaign chapters;
- redesign of the existing 30 Campaign puzzles;
- changing the core validator to require explicit FLOOR cells;
- changing Daily mode.

Those remain separate polish/content tasks after onboarding is structurally correct.

## Acceptance Criteria

The task is complete when a brand-new player experiences four small fully guided tutorial puzzles, wins each by placing the correct walls only, reaches a Tutorial Complete transition, and can then enter unchanged Campaign Level 1; an existing player with Campaign progress is not forced through Tutorial; and the old campaign-embedded onboarding no longer appears.
