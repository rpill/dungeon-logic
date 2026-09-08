# Dungeon Logic v1 — Product, UI, Daily, Monetization, and Responsive Design

**Date:** 2026-09-08  
**Status:** design agreed in chat; implementation begins only after this written spec is accepted.

## 1. Product thesis

Dungeon Logic v1 is a clean logic-puzzle product built around the mechanics and generator archetypes that already exist. The first commercial version does **not** add new gameplay mechanics just to manufacture variety. Variety comes from puzzle quality, difficulty progression, manuscript structure, Daily puzzles, and presentation.

The product must work well both in desktop browser and mobile browser inside Yandex Games.

Core loop:

1. Continue campaign or play Daily.
2. Solve a short logic puzzle.
3. Receive a concise completion result.
4. Advance manuscript progress or Daily streak.
5. Return for more campaign puzzles or the next day's Daily.

v1 deliberately avoids lives, energy, mandatory currency, shop loops, XP, battle passes, quests, mailboxes, and similar F2P scaffolding.

## 2. Gameplay scope

v1 uses the generator capabilities already implemented:

- `monster-only`
- `chest-one-room`
- `mixed-one-room`

No new generator mechanic is required for v1.

Future mechanics may arrive later through additional sealed manuscripts. Future slots never affect current 100% completion.

## 3. Campaign: 30 levels, 4 real manuscripts

### Manuscript I — Азбука

- 7 levels.
- 001–005 are onboarding.
- Existing pilot sequence remains conceptually:
  - 001 monster-only
  - 002 chest-one-room
  - 003 monster-only
  - 004 mixed-one-room
  - 005 chest-one-room
- 006–007 reinforce the full rule set without tutorial overlays.
- Manuscript II unlocks at **6/7** solved.

### Manuscript II — Дедукция

- 7 levels.
- Mostly monster-only.
- Difficulty increases through fewer obvious opening moves, longer deduction chains, stronger clue interaction, and greater use of 7×7.
- Manuscript III unlocks at **6/7** solved.

### Manuscript III — Комнаты

- 8 levels.
- Mostly chest-one-room, progressively mixing in mixed puzzles.
- Difficulty grows through room placement, delayed room deductions, row/column interaction, and mixed constraints.
- Manuscript IV unlocks at **7/8** solved.

### Manuscript IV — Мастерство

- 8 levels.
- Best difficult puzzles across existing archetypes.
- Mostly 7×7 when appropriate.
- No boss gimmick or new mechanic.
- Campaign completion = **30/30**.

### Manuscripts V and VI — sealed future content

Visible as non-interactive teasers only.

They must:

- show no `0/N` counter;
- show no unlock requirement;
- promise no date;
- promise no unimplemented mechanic;
- not count toward 100%;
- be visually distinct from ordinary progression locks.

Suggested copy: `Запечатанная рукопись` / `Содержимое пока неизвестно`.

## 4. Unlock model

### Onboarding

001 → 002 → 003 → 004 → 005 are strictly linear.

After 005, 006 and 007 may both be available.

### Post-onboarding

Inside an unlocked manuscript, keep a frontier of up to **three unsolved available puzzles**.

Example:

- 08, 09, 10 available;
- player solves 09;
- 08, 10, 11 are now available.

The content still has an authored order; the player simply receives limited choice so one difficult puzzle cannot block the entire product.

## 5. Onboarding: first five levels

There is no mandatory full-screen `How to Play` before gameplay.

Rules appear contextually only when immediately actionable.

### Level 1

Teach:

- clue numbers;
- Wall tool;
- Floor mark tool.

The player performs the highlighted actions themselves. Tutorial disappears immediately afterward.

### Level 2

Introduce the existing chest / treasure-room rule with one concrete consequence on the actual level.

### Level 3

No tutorial overlay. First fully independent solve. Hint is available.

### Level 4

Mixed puzzle. One short message that known rules now work together. No new mechanic.

### Level 5

Reinforcement. On completion:

- Daily unlocks;
- onboarding protection ends;
- first interstitial opportunity may exist from this point onward.

## 6. Cell states

Editable logical states:

- Unknown
- Wall
- Floor mark

Fixed objects:

- Monster
- Chest

Floor mark is always an overlay on the same underlying floor, never a different floor material.

## 7. Unified input model

Primary tools:

- Wall
- Floor

Applying the active tool:

- Unknown → active state
- opposite editable state → active state
- same state → Unknown

### Drag painting

Mouse and touch drag are supported.

Drag mode is determined by the first cell:

- start on Unknown/opposite → paint active state;
- start on active state → erase to Unknown.

One drag gesture = one Undo action.

### Desktop shortcuts

Optional accelerators:

- left click: active tool
- right click: quick Floor
- `1`: Wall
- `2`: Floor
- `Ctrl+Z`: Undo
- `R`: Reset
- `H`: Hint

The tutorial never depends on shortcuts.

### Mobile

Use only tap and drag. No required long press, double tap, or gesture-based tool switching.

During board drag, browser scrolling is suppressed.

## 8. Puzzle screen

Persistent gameplay actions:

- Back
- Wall
- Floor
- Undo
- Reset
- Hint

Rules:

- Undo is unlimited and never monetized.
- Back auto-saves current puzzle state.
- No separate Pause button.
- Timer pauses on lost focus/backgrounding, settings overlay, and ad playback.
- Reset asks confirmation when meaningful progress exists; tiny edit counts may reset immediately.

## 9. Conflict feedback

The game may show **visible-rule contradictions only**.

Example: a row requiring 2 walls currently contains 3 placed walls.

The game must **not** reveal that a cell disagrees with the hidden solution unless that creates a visible-rule contradiction. This prevents brute-force solution probing.

Satisfied clues become visually subdued, not bright green.

## 10. Puzzle completion

Completion is detected automatically after edits. No `Check` button.

On solve:

1. disable input;
2. short board response (~300–500 ms);
3. show result overlay while the finished board remains visible.

## 11. Hints

v1 hint deliberately stays simple.

A hint reveals one cell with a determined correct state:

- this cell is Wall; or
- this cell is Floor.

The cell/tool is highlighted, but the game does not place the state automatically.

Allowance:

- first **3 hints are free** globally for the early player experience;
- afterward **1 completed rewarded video = 1 hint**.

Hints are also allowed in Daily. They never invalidate streak, but results retain hints-used data.

## 12. Daily system

Daily unlocks after Level 5.

Daily is **not** generated on the player's device.

Pipeline:

1. offline generator produces candidates;
2. existing acceptance/ranking/human-analysis validates them;
3. approved immutable snapshots are promoted;
4. trusted date maps deterministically to one snapshot.

Launch target: approximately **60 prevalidated Daily puzzles**.

Behavior:

- one puzzle per calendar day;
- same puzzle for everyone;
- target solve time ~3–8 active minutes for a trained player;
- missed Daily cannot be backfilled in v1;
- today's Daily can be replayed;
- streak credits only once per day;
- best time may improve on replay;
- timer counts active solving time only.

### Trusted date

Use Yandex trusted server time where available, with platform-safe fallback behavior when unavailable.

### Streak data

Persist:

- current streak
- best streak
- last Daily solved date
- total Dailies solved
- solved-date history
- per-date result summary

No streak freeze and no loss-pressure countdown in v1.

### Daily ads

No forced interstitial immediately after Daily completion.

Rewarded Hint remains available by explicit request.

## 13. Home

Home answers only:

1. What should I do now?
2. Is today's Daily available/new?
3. Where is my progress?

### Before Level 5

- Start/Continue is primary.
- Daily is hidden completely.

### After Level 5

Primary items:

- Continue
- Daily
- Archive
- Statistics
- Settings

Continue resumes an unfinished saved puzzle; otherwise it selects a suitable unsolved available campaign level.

After 30/30, campaign action becomes `Choose level` while Daily stays prominent.

## 14. Archive / manuscripts

### Desktop

Two-pane layout:

- manuscript list left;
- selected manuscript levels right.

No unnecessary separate navigation step.

### Mobile

Two screens:

1. manuscript list;
2. selected manuscript level page.

### Manuscript states

Real content:

- active;
- enough completed to unlock next;
- fully completed;
- locked with explicit current-game requirement.

Future content:

- sealed style;
- no progress;
- no condition;
- no date;
- no interaction.

### Level cards

Do not show generator archetype, star rating, difficulty badge, or noisy metadata by default.

Solved-level details may show best time and hints after selection.

## 15. Win and progression overlays

### Campaign win

Show only:

- Solved
- active time
- hints summary
- new record when applicable
- `To manuscript`
- `Next`

### Manuscript unlock

Brief special event:

- manuscript unlocked
- title
- `Open`
- `Stay here`

No currency reward.

### Daily win

Show:

- Daily solved
- time
- hints summary
- current streak
- compact recent calendar feedback
- `Home`

No forced interstitial.

## 16. Statistics

### Campaign

- solved / 30
- fully completed manuscripts / 4
- campaign puzzles solved without hints

### Daily

- total solved
- current streak
- best streak
- solved without hints

### Overall

- total active play time
- total puzzles solved
- total hints used

Include a monthly Daily calendar with solved / missed / today states.

Do not add fake IQ, score, click counts, wall counts, undo averages, etc.

## 17. Settings

v1 minimum:

- Music
- Sound
- Vibration on supported mobile devices
- Language
- How to Play
- privacy/legal link if required
- Reset progress

Future optional item: Remove Ads.

## 18. Monetization v1

### Interstitial

- no opportunities during Levels 001–005;
- never during active solving;
- never because of Reset/Undo;
- after onboarding, initial policy: opportunity about every **2 campaign completions**;
- protective interval around **4–5 minutes** between opportunities/displays as appropriate;
- trigger only from a deliberate logical transition such as `Next` after a win;
- platform SDK may further suppress actual display.

### Rewarded

- used for Hint only in v1;
- one rewarded completion = one immediate hint;
- player understands reward before playback.

### Sticky banner

Disabled in v1.

Could be tested later only on non-gameplay screens if real monetization data justifies it.

### IAP

No currency, consumable hint packs, energy, lives, or store in v1.

Architecturally leave room for future non-consumable Remove Ads, but do not implement it as launch requirement.

## 19. Responsive layout

Use viewport classes, not device identity.

Initial classes:

- **Wide:** >= ~1100 px
- **Compact:** ~700–1099 px
- **Narrow:** < ~700 px

Exact thresholds are tunable.

### Wide

- board remains visually centered in viewport;
- side regions may host controls/info/decor later;
- side UI must not push board off visual center.

### Compact

- remove secondary side panels;
- header + board + toolbars.

### Narrow / portrait mobile

- board takes maximum useful width with ~12–16 px margins;
- compact header;
- Wall/Floor controls are largest gameplay buttons;
- Undo/Reset/Hint below;
- touch targets ~44–48 CSS px minimum;
- respect safe-area insets.

### Mobile landscape

Reuse compact behavior, optionally moving controls beside board when height is constrained.

### Board sizing

Remove the assumption that `cellSize = 72` is permanent.

Compute cell size from available width/height and grid dimensions, with a sensible desktop maximum.

## 20. Temporary implementation visual style

Before final art, return the project to an asset-free wireframe.

Suggested temporary language:

- background: `#111318`
- floor: light neutral gray
- wall: near-black square
- floor mark / active clues: muted red
- monster: simple symbol/text placeholder
- chest: simple symbol/text placeholder
- system/monospace typography

Do not use ORYX board terrain or custom theme art while implementing product/UI systems.

The goal is to validate flow, input, persistence, responsive layout, Daily, and monetization hooks without art decisions obscuring UX problems.

## 21. Final art direction boundary

Preferred final direction remains a monochrome black/ivory print or linocut-inspired style with a restrained red accent.

Final asset generation/integration happens **after** the wireframe product phase works on mobile and desktop.

Final art must preserve:

- strict top-down binary walls;
- calm floor;
- clean clue region;
- mobile legibility;
- modular assets, not whole-screen slicing.

## 22. Explicitly out of scope for v1

- new generator mechanics
- lives
- energy
- soft/premium currency
- shop
- battle pass
- mailbox
- quests
- weekly events
- leaderboard
- clans/social
- cosmetics store
- XP/player level
- dedicated achievements screen
- streak freeze
- Daily archive/backfill
- final Silent Scriptorium assets before wireframe UX validation

## 23. Wireframe phase exit criteria

The product is ready to return to final art when:

1. 001–005 onboarding works as designed.
2. Four manuscripts and nonlinear frontier unlocking work.
3. Home / Archive / Puzzle / Win / Stats / Settings work.
4. Daily unlock, trusted-date selection, streak, and calendar work.
5. Active puzzle autosave/resume works.
6. Free hints and rewarded-hint hook work with fallback.
7. Interstitial eligibility never interrupts active solving.
8. Wide / Compact / Narrow layouts are usable.
9. Existing campaign/generator invariants and sanities still pass.
10. The game is pleasant to play using placeholder visuals only.
