# Dungeon Logic — Technical Specification

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