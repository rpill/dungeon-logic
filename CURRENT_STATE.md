# Dungeon Logic — Current State

Last updated: project initialization.

## Current status

The project is at the initialization stage.

No gameplay systems have been implemented yet.

## Technology

Selected:

* Phaser;
* TypeScript;
* Vite.

Target:

* browser;
* Yandex Games.

## Available art

User owns:

ORYX Ultimate Fantasy 1.2.

The asset pack has not yet been integrated into the game.

## Implemented

* game concept defined;
* initial puzzle rules documented;
* technical direction defined.
* Phaser bootstrap;
* BootScene;
* GameScene;
* base puzzle types;
* PuzzleState with UNKNOWN / WALL / FLOOR states;
* fixed monster cells;
* manual 6×6 level definition;
* level001 data.

## Not implemented

* BootScene;
* GameScene;
* puzzle grid;
* cell input;
* row clues;
* column clues;
* monsters;
* validation;
* Undo;
* Restart;
* victory;
* ORYX rendering;
* level loading;
* saving;
* Yandex SDK.

## Current milestone

Create the first playable 6×6 prototype.

The prototype must allow the player to:

1. see a fixed puzzle;
2. read row and column wall clues;
3. click editable cells;
4. switch cells between logical states;
5. see predefined monsters;
6. Undo;
7. Restart;
8. solve the puzzle;
9. receive a victory state.

## Current task

Create the initial Phaser project structure and minimal application bootstrap.

## Explicitly postponed

Do not implement yet:

* procedural generation;
* solver;
* hints;
* daily challenges;
* progression;
* level select;
* Yandex SDK;
* advertising;
* achievements;
* leaderboard;
* economy;
* hero traversal animation.

## Next milestone

One complete manually-authored puzzle using placeholder visuals first, followed by the first ORYX visual pass.