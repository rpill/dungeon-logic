# Dungeon Logic — Technical Specification


## Ranked Daily / leaderboard boundary

- `DailyService` owns the ranked-attempt lifecycle and immutable first successful result.
- `daily.activePuzzle` persists the ranked puzzle snapshot and original trusted `startedAtMs`; Reset never replaces that attempt.
- Ranked elapsed time is finalized from the platform `TrustedClock` (`ysdk.serverTime`) rather than the ordinary active-play timer.
- `LeaderboardsPort` is part of `PlatformServices`; local implementation is unavailable/no-op, Yandex implementation wraps `ysdk.leaderboards`.
- `DailyService.getArchive()` exposes released past manifest entries newest-first; archive completions persist first result/totalSolved but never touch streak fields or Yandex ranking.
- Daily uses one permanent technical leaderboard `daily`; `DailyLeaderboard.ts` packs UTC day + inverted first-completion time into a safe integer and decodes/filter rows back to the requested date.
- The Yandex leaderboard uses a numeric score sorted DESC; `DailyLeaderboard.ts` encodes the UTC day in the high-order part and inverted completion milliseconds in the low-order part.
- `requestAuthorization()` is only invoked from an explicit player action; score submission itself never opens auth.
- `LeaderboardScene` only submits the stored fixed Daily result when `minHintsUsed === 0`; replay/practice/assisted results are never eligible.

## Tutorial runtime / profile v2

- Tutorial — first-class runtime mode (`tutorial`), не fake Campaign level.
- Stable IDs: `tutorial-001`–`tutorial-005`; Campaign IDs/slots остаются `campaign-001`–`campaign-030`.
- `PlayerProfileV2` хранит отдельный `tutorial` state и migration из schema v1.
- `SerializedPuzzleState.mode` поддерживает `campaign | daily | tutorial`.
- Tutorial завершает пазл только через общий `LevelValidator`; onboarding может направлять `FLOOR`-дедукции как обучающие пометки, но solved-state по-прежнему не требует размечать весь пол.
- Tutorial onboarding не имеет standalone `MessageOnboardingStep`: каждый текст привязан к конкретному `board-cells` действию. После выполнения нужных WALL/FLOOR клеток `GameScene` сразу продвигает flow и меняет текст; отдельный клик по плашке для продолжения отсутствует.
- Tutorial v2 использует пять authored teaching fixtures; новый rule вводится только когда он создаёт видимую однозначную дедукцию.
- Profile normalization трактует persisted `tutorial.completed=true` из старой четырёхуровневой версии как completion всех пяти стабильных Tutorial IDs.
- `HelpRules.ts` разделяет восемь puzzle-rule cards и отдельные utility entries (`controls`, `feedback`).

## Hint economy / ranked Daily assistance

- `HintEconomy.ts` централизует `MAX_FREE_HINTS = 3`, `FREE_HINT_RECHARGE_MS = 30 min` и `RANKED_DAILY_HINT_UNLOCK_MS = 5 min`.
- `PlayerProfile.hints.rechargeAnchorMs` хранит anchor восстановления; `PlayerProfileService.getHintRechargeStatus()` лениво начисляет пропущенные интервалы и cap-ит запас на 3.
- Rewarded Hint не увеличивает free pool: реклама оплачивает конкретную немедленную подсказку и увеличивает только `totalUsed`.
- Ranked Daily до 5 минут не позволяет запросить Hint. После 5 минут Hint разрешён, но `DailyService.completeDaily()` помечает результат `ranked=false`, если `hintsUsed > 0`.
- Assisted on-time Daily всё ещё обновляет completion/totalSolved/streak; archive Daily не обновляет streak независимо от Hint.
- Yandex leaderboard boundary дублирует защиту: UI/adapter не публикуют локальный Daily result с `minHintsUsed > 0`.

## Stack

Runtime:

* Browser

Game framework:

* Phaser

Language:

* TypeScript

Build system:

* Vite

Target platform:

* Yandex Games

Development target:

* modern desktop browsers first;
* touch support later.

---

## Project principles

The puzzle model must not depend directly on Phaser where avoidable.

Separate:

### Puzzle logic

Contains:

* level data;
* cell state;
* rules;
* validation;
* solution checking.

### Presentation

Contains:

* sprites;
* tilemap-like rendering;
* interaction;
* animations;
* UI;
* audio.

---

## Suggested source structure

src/
main.ts

scenes/
BootScene.ts
GameScene.ts

puzzle/
types.ts
PuzzleState.ts
PuzzleRules.ts
LevelValidator.ts

board/
BoardView.ts
CellView.ts

ui/
PuzzleHUD.ts

data/
levels/
level001.ts

Later:

services/
SaveService.ts
YandexService.ts

solver/
PuzzleSolver.ts

---

## Scene responsibility

BootScene

Responsibilities:

* preload required assets;
* prepare textures;
* start GameScene.

GameScene

Responsibilities:

* create current level;
* connect puzzle state with its visual representation;
* receive high-level UI actions;
* process level completion.

GameScene should not become the place where every puzzle rule is implemented.

---

## PuzzleState

Stores the current logical board.

Expected data:

* width;
* height;
* current player markings;
* fixed cells;
* level clues;
* move history if appropriate.

PuzzleState should contain as little Phaser-specific code as possible.

---

## PuzzleRules

Contains reusable rule checks.

Examples:

* countWallsInRow();
* countWallsInColumn();
* isMonsterValid();
* containsIllegalOpen2x2();
* isFloorConnected();

Names are illustrative and can change during implementation.

Do not create methods until they are actually required.

---

## LevelValidator

Combines active rules for a particular level and determines whether the current state is solved.

Do not make validation depend on sprite positions.

---

## Level format

Levels should be data, not Phaser scenes.

Preferred concept:

{
id,
width,
height,
rowClues,
columnClues,
fixedCells,
solution
}

The exact TypeScript interfaces will be created when implementation starts.

Keeping the complete solution in client data is acceptable for the initial prototype.

Later we can reconsider the format if required.

---

## Coordinates

Use zero-based logical coordinates:

x = 0 ... width - 1
y = 0 ... height - 1

Use consistent indexing.

Preferred board access:

cells[y][x]

Do not mix x/y conventions between systems.

---

## Assets

ORYX Ultimate Fantasy 1.2 assets live under:

public/assets/oryx/

Preserve the purchased asset pack's useful internal organisation where practical.

Do not rename hundreds of source assets just to match code style.

Create our own game-specific keys when loading assets through Phaser.

Example concept:

this.load.image(
"dungeon-floor",
"assets/oryx/..."
);

Exact ORYX paths must only be written after inspecting the actual purchased files.

Never invent ORYX filenames.

---

## Resolution

Do not hardcode the final production resolution yet.

For the prototype use a responsive Phaser container.

The puzzle board should remain centered and readable.

Important:

* avoid relying on absolute browser resolution;
* board size should derive from available game area;
* leave space for row/column clues and controls.

---

## Input

Initial desktop input:

* pointer click.

Later:

* drag painting;
* right-click or alternative marking;
* touch;
* keyboard shortcuts.

Input should call logical board actions instead of manipulating solution state directly.

---

## Undo

User actions should be reversible.

Initial implementation can store previous cell changes.

Do not build a complex command framework unless needed.

---

## Saving

Not part of the first vertical slice.

Later:

* localStorage during development;
* Yandex Games storage/cloud capabilities if appropriate.

---

## Yandex SDK

Do not integrate until the standalone game works correctly.

Later integration areas:

* SDK initialization;
* player data;
* ads;
* leaderboard if used;
* platform-specific lifecycle.

Keep Yandex-specific code isolated from puzzle rules.

---

## Testing

Puzzle rules should be designed so they can eventually be unit tested without launching Phaser.

High-value future tests:

* row wall counting;
* column wall counting;
* connectivity;
* monster dead-end validation;
* illegal 2×2 detection;
* solved-state validation.

---

## Performance

This game uses small grids.

Prefer simple readable algorithms.

A flood fill over a 12×12 board is trivial.

Do not optimize these systems prematurely.

---

## Future systems

Not part of initial architecture unless actually needed:

* PuzzleSolver;
* PuzzleGenerator;
* HintEngine;
* DailyChallengeService;
* AnalyticsService;
* YandexService;
* SaveService.

Build them when the prototype justifies them.