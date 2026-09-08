# Dungeon Logic Wireframe Puzzle/Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the puzzle screen asset-free, responsive, and equally usable with mouse or touch, including active tools, gesture-level Undo, Reset, and visible-rule conflict feedback.

**Architecture:** Move editable-state transitions and Undo transactions into a pure `PuzzleInteractionSession`, then make `BoardView` a Phaser renderer/input adapter. Replace theme sprites with primitive rectangles/text for the wireframe phase and calculate board placement from an explicit viewport layout class.

**Tech Stack:** TypeScript 6, Phaser 4.2, `tsx` sanity scripts.

**Spec:** `docs/superpowers/specs/2026-09-08-dungeon-logic-v1-product-ui-design.md`

## Global Constraints

- No ORYX/custom board art at runtime.
- Editable states: Unknown, Wall, Floor.
- Fixed Monster/Chest are not editable.
- Floor mark does not replace or recolor the floor.
- One drag gesture = one Undo action.
- Mobile input requires only tap and drag.
- Visible-rule overfill may show conflict; hidden-solution mismatch may not.

---

### Task 1: Pure interaction session

**Files:**
- Create: `src/gameplay/PuzzleInteractionSession.ts`
- Create: `src/dev/puzzleInteractionSanity.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `PuzzleTool = 'wall' | 'floor'`
- Produces: `PuzzleInteractionSession.setActiveTool(tool: PuzzleTool): void`
- Produces: `beginGesture(x: number, y: number, toolOverride?: PuzzleTool): void`, `visitGestureCell(x: number, y: number): boolean`, `endGesture(): boolean`
- Produces: `undo(): boolean`, `reset(): boolean`, `canUndo(): boolean`, `getEditCount(): number`, `getActiveTool(): PuzzleTool`

- [ ] **Step 1: Write failing sanity for tool semantics and one-gesture Undo**

```ts
const puzzle = new PuzzleState(level);
const session = new PuzzleInteractionSession(puzzle);
session.setActiveTool('wall');
session.beginGesture(0, 0);
session.visitGestureCell(0, 0);
session.visitGestureCell(1, 0);
session.endGesture();
assert(puzzle.getCellState(0, 0) === CellState.Wall, 'wall painted');
assert(puzzle.getCellState(1, 0) === CellState.Wall, 'drag painted');
assert(session.undo(), 'gesture undo exists');
assert(puzzle.getCellState(0, 0) === CellState.Unknown, 'first cell restored');
assert(puzzle.getCellState(1, 0) === CellState.Unknown, 'whole drag restored');
```

Also assert same-state gesture erases, opposite-state gesture replaces, fixed cells stay unchanged, duplicate visits in one gesture do nothing, and reset is undoable as one action.

- [ ] **Step 2: Run failing sanity**

Run: `npx tsx src/dev/puzzleInteractionSanity.ts`
Expected: FAIL because `PuzzleInteractionSession` does not exist.

- [ ] **Step 3: Implement snapshot-based history**

Use a small board snapshot because current puzzles are at most single-digit grid sizes:

```ts
type PuzzleSnapshot = readonly (readonly CellState[])[];

function capture(puzzle: PuzzleState): PuzzleSnapshot {
  return Array.from({ length: puzzle.level.height }, (_, y) =>
    Array.from({ length: puzzle.level.width }, (_, x) => puzzle.getCellState(x, y)),
  );
}
```

A gesture captures `before` once, derives erase/paint mode from the first editable cell, mutates each visited cell at most once, and pushes `before` only when at least one state changed. Undo restores each editable cell using `setCellState`.

- [ ] **Step 4: Add `sanity:puzzle-interaction` and run**

Add:

```json
"sanity:puzzle-interaction": "tsx src/dev/puzzleInteractionSanity.ts"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gameplay/PuzzleInteractionSession.ts src/dev/puzzleInteractionSanity.ts package.json
git commit -m "feat: add puzzle interaction session"
```

### Task 2: Asset-free CellView and BoardView

**Files:**
- Modify: `src/board/CellView.ts`
- Modify: `src/board/BoardView.ts`
- Modify: `src/campaign/types.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Modify: `src/scenes/BootScene.ts`
- Replace: `src/dev/boardTileVisualSanity.ts` with wireframe assertions

**Interfaces:**

Replace the runtime launch context with an art-independent shape:

```ts
export type GameLaunchContext =
  | { readonly mode: 'campaign'; readonly campaignLevelId: string }
  | { readonly mode: 'dev' };

export type FixedCellVisual =
  | { readonly kind: 'monster'; readonly marker: 'M' }
  | { readonly kind: 'chest'; readonly marker: 'C' }
  | { readonly kind: 'technical'; readonly marker: 'X' | '↔' | '↕' }
  | null;
```

- BoardView consumes `PuzzleInteractionSession` instead of `BoardVisualTheme`.
- Produces: `setActiveTool(tool: PuzzleTool): void`, `undo(): boolean`, `reset(): boolean`, `setInputEnabled(enabled: boolean): void`.
- Produces callback `onPuzzleChanged(): void` after each actual state mutation.

- [ ] **Step 1: Rewrite board visual sanity to require primitives only**

Assert that a fake scene receives rectangles/text, no gameplay-cell `image()` calls, and no `tileSprite()` calls. Assert Unknown/Floor share the same floor fill while Floor adds only `◆`; Wall is near-black; Monster is `M`; Chest is `C`.

- [ ] **Step 2: Run sanity and verify failure**

Run: `npm run sanity:board-visual`
Expected: FAIL because current CellView uses theme images.

- [ ] **Step 3: Implement wireframe renderer**

Use constants matching the approved temporary language:

```ts
export const WIREFRAME = {
  background: 0x111318,
  floor: 0xd8d8d8,
  wall: 0x242424,
  grid: 0x5f646a,
  mark: '#d54a42',
  clueActive: '#d54a42',
  clueComplete: '#777b7d',
  fixedText: '#111318',
} as const;
```

`CellView` owns a floor rectangle, a wall rectangle whose visibility changes, and text markers. Do not load any board theme assets in `BootScene.preload()`.

- [ ] **Step 4: Delegate input to PuzzleInteractionSession**

Pointer down begins a gesture with `toolOverride = 'floor'` only when `pointer.rightButtonDown()`; otherwise it uses the selected tool for both left mouse and touch. Pointer over visits additional cells while `pointer.isDown` remains true. Pointer up/upoutside ends the gesture. This avoids depending on mouse-button APIs for touch painting.

- [ ] **Step 5: Run sanities**

Run:

```bash
npm run sanity:puzzle-interaction
npm run sanity:board-visual
npm run sanity:campaign-runtime
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/board src/campaign/types.ts src/runtime/GameLaunch.ts src/scenes/BootScene.ts src/dev/boardTileVisualSanity.ts
git commit -m "feat: restore asset-free puzzle board"
```

### Task 3: Responsive puzzle layout

**Files:**
- Replace: `src/scenes/GameBoardLayout.ts`
- Modify: `src/dev/gameBoardLayoutSanity.ts`

**Interfaces:**
- Produces `ViewportClass = 'wide' | 'compact' | 'narrow'`.
- Produces `classifyViewport(width: number): ViewportClass` using initial thresholds 1100 and 700.
- Produces `calculateGameBoardLayout(viewportWidth, viewportHeight, boardColumns, boardRows): GameBoardLayout` with board center kept at viewport center.

- [ ] **Step 1: Write failing layout cases**

Required cases:

```ts
assert(classifyViewport(1280) === 'wide');
assert(classifyViewport(900) === 'compact');
assert(classifyViewport(390) === 'narrow');
```

For 390×844 and 7×7, assert the board + clue gutter fits within 16px horizontal margins and bottom toolbar safe space, and each gameplay cell is at least 44 CSS px when geometry permits. For 1280×720, assert desktop cell size is capped rather than filling the screen.

- [ ] **Step 2: Run failing sanity**

Run: `npx tsx src/dev/gameBoardLayoutSanity.ts`
Expected: FAIL against the old fixed-72 model.

- [ ] **Step 3: Implement available-rectangle sizing**

Reserve per layout:

```ts
const margins = viewportClass === 'narrow' ? 16 : 24;
const headerHeight = viewportClass === 'narrow' ? 72 : 92;
const toolbarHeight = viewportClass === 'narrow' ? 132 : 96;
const clueCells = 1;
```

Compute `cellSize = floor(min(availableWidth/(columns+1), availableHeight/(rows+1), desktopMax))`; center `(columns * cellSize)` gameplay board in the viewport, not in a side-column remainder.

- [ ] **Step 4: Run sanity**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameBoardLayout.ts src/dev/gameBoardLayoutSanity.ts
git commit -m "feat: make puzzle layout responsive"
```

### Task 4: Puzzle toolbar and shortcuts

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Create: `src/runtime/PuzzleUiState.ts`
- Create: `src/dev/wireframeUiSanity.ts`
- Modify: `package.json`

**Interfaces:**
- GameScene owns selected tool and updates BoardView via `setActiveTool`.
- Buttons in this plan: Back, Wall, Floor, Undo, Reset. Plan 3 adds the functional Hint action and then it becomes persistent.
- Keyboard: `ONE`, `TWO`, `CTRL+Z`, `R`, `H`; right click remains quick Floor.

- [ ] **Step 1: Add pure toolbar-state helpers to sanity**

Create `src/runtime/PuzzleUiState.ts` with `createPuzzleToolbarState(activeTool: PuzzleTool, canUndo: boolean)` returning the exact button labels/active/disabled state. Sanity asserts Wall is default, selecting Floor updates active state, Undo disabled state follows `canUndo`, and Narrow buttons meet 48px height.

- [ ] **Step 2: Implement toolbar**

Use Phaser rectangles/text only. `Reset` asks confirmation only when `session.canUndo()` indicates meaningful edited state; the minimal-edit threshold can be represented by `session.getEditCount()` with threshold `<3` resetting directly.

- [ ] **Step 3: Register keyboard, safe areas, and browser drag suppression**

Prevent context menu is already global. During active board gesture, call `pointer.event.preventDefault()` when available; CSS sets `touch-action: none` on the canvas. Expose CSS custom properties from `env(safe-area-inset-top, 0px)` and `env(safe-area-inset-bottom, 0px)` and include them when calculating Narrow header/toolbar reserves so controls do not sit under a notch or navigation bar.

- [ ] **Step 4: Add/run sanity**

Add `"sanity:wireframe-ui": "tsx src/dev/wireframeUiSanity.ts"` and run:

```bash
npm run sanity:wireframe-ui
npm run sanity:board-visual
npm run sanity:puzzle-interaction
npm run build
```

- [ ] **Step 5: Manual viewport smoke**

Run `npm run dev` and inspect 1280×720, 900×700, and 390×844 before committing.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.ts src/runtime/PuzzleUiState.ts src/style.css src/dev/wireframeUiSanity.ts package.json
git commit -m "feat: add responsive puzzle controls"
```
