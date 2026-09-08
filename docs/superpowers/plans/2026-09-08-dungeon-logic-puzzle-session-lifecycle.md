# Dungeon Logic Puzzle Session Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add autosave/resume, active-time tracking, contextual onboarding, hints, and concise campaign completion results to the wireframe puzzle screen.

**Architecture:** A pure `PuzzleSessionState` serializes board/timer/hint metadata into PlayerProfile; `GameScene` owns presentation and delegates persistence to a session service. Hints use the immutable level solution only as an explicit paid/free assist and never feed ordinary conflict feedback.

**Tech Stack:** TypeScript 6, Phaser 4.2, Page Visibility API.

**Spec:** `docs/superpowers/specs/2026-09-08-dungeon-logic-v1-product-ui-design.md`

## Global Constraints

- Back auto-saves and never discards progress.
- Active timer pauses on visibility loss, overlays, and later ad playback.
- First 3 hints are free globally; hint reveals one determined correct state but does not apply it.
- Normal play never reveals hidden-solution mismatch.
- 001–005 onboarding is contextual; no mandatory full-screen rules page.

---

### Task 1: Saved puzzle serialization

**Files:**
- Create: `src/gameplay/PuzzleSessionState.ts`
- Create: `src/gameplay/PuzzleSessionService.ts`
- Modify: `src/profile/types.ts`
- Create: `src/dev/puzzleSessionSanity.ts`
- Modify: `package.json`

**Interfaces:**

```ts
// Reuse SerializedPuzzleState from src/profile/types.ts exactly; do not introduce a second save shape.
export interface SerializedPuzzleState {
  readonly mode: 'campaign' | 'daily';
  readonly puzzleId: string;
  readonly cells: readonly (readonly CellState[])[];
  readonly activePlayMs: number;
  readonly hintsUsed: number;
  readonly startedAtMs: number;
}
```

`PuzzleSessionService.createCampaign(level, saved?: SerializedPuzzleState)`, `snapshot()`, `saveNow()`, `clearActivePuzzle()`, `addActiveTime(ms)`, `recordHint()`.

- [ ] **Step 1: Write round-trip sanity**

Create a puzzle, place Wall/Floor, snapshot, restore into a fresh session, and assert exact editable cells/timer/hints survive while fixed Monster/Chest remain Floor.

- [ ] **Step 2: Implement validation**

Reject snapshot if puzzle id, width, height, enum values, or fixed-cell states do not match the current level; fall back to fresh session instead of throwing on startup.

- [ ] **Step 3: Persist active puzzle through PlayerProfileService**

Campaign start writes/replaces `campaign.activePuzzle`; every committed gesture updates the in-memory profile immediately and schedules the profile service's 5-second coalesced save. Back, document visibility loss, and solve call `flush()` immediately. Solve clears `campaign.activePuzzle` only after the completion result is persisted.

- [ ] **Step 4: Run/add sanity script**

Add `sanity:puzzle-session`.

- [ ] **Step 5: Commit**

```bash
git add src/gameplay/PuzzleSessionState.ts src/gameplay/PuzzleSessionService.ts src/profile/types.ts src/dev/puzzleSessionSanity.ts package.json
git commit -m "feat: autosave puzzle sessions"
```

### Task 2: Active timer

**Files:**
- Create: `src/gameplay/ActiveTimer.ts`
- Modify: `src/scenes/GameScene.ts`
- Extend: `src/dev/puzzleSessionSanity.ts`

**Interfaces:**
- `start(nowMs)`, `pause(nowMs)`, `resume(nowMs)`, `getElapsedMs(nowMs)`, `isRunning()`.

- [ ] **Step 1: Add deterministic fake-clock tests**

Assert 0→5000 adds 5s, paused interval adds 0, resume continues, and restored base time is included.

- [ ] **Step 2: Hook Page Visibility**

On `document.visibilitychange`, pause when hidden and resume when visible. Pause while confirmation/onboarding/hint/win overlays are open.

- [ ] **Step 3: Render secondary timer text**

Format `mm:ss`; do not dominate the header.

- [ ] **Step 4: Run sanity/build and commit**

```bash
npm run sanity:puzzle-session
npm run build
git add src/gameplay/ActiveTimer.ts src/scenes/GameScene.ts src/dev/puzzleSessionSanity.ts
git commit -m "feat: track active puzzle time"
```

### Task 3: Contextual onboarding state machine

**Files:**
- Create: `src/onboarding/OnboardingFlow.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Modify: `src/scenes/GameScene.ts`
- Create: `src/dev/onboardingSanity.ts`

**Interfaces:**
- `OnboardingStep` targets `clue`, `tool-wall`, `board-cell`, `tool-floor`, or `message`.
- `createOnboardingFlow(slot: number): readonly OnboardingStep[]`.
- Only first incomplete play of slots 1, 2, and 4 emits steps; 3 and 5 have no blocking tutorial panel.

- [ ] **Step 1: Encode exact level behavior**

Slot 1 uses exact anchors from `campaign-001`: clue message → Wall tool prompt → cell `(0,0)` (row clue 5 with the fixed Monster at `(2,0)` makes it a wall) → Floor tool prompt → cell `(1,5)` (row clue 0 makes it floor). Slot 2 uses `campaign-002`: highlight the Chest at `(6,2)`, explain the 3×3 treasure-room rule, then highlight `(5,2)` as an interior floor consequence. Slot 4 shows one short message that known rules combine. Slots 3/5: none.

Store this exact mapping in `OnboardingFlow.ts` keyed by campaign level id; do not guess tutorial coordinates dynamically from renderer state.

- [ ] **Step 2: Sanity first-run vs replay**

Completed level replay receives no onboarding.

- [ ] **Step 3: Replace old modal `How this level works`**

Use small callouts that dismiss/advance after the player performs the expected action. Never block the entire board longer than needed.

- [ ] **Step 4: Run/commit**

```bash
npx tsx src/dev/onboardingSanity.ts
npm run build
git add src/onboarding src/runtime/GameLaunch.ts src/scenes/GameScene.ts src/dev/onboardingSanity.ts
git commit -m "feat: add contextual onboarding"
```

### Task 4: Free hint selection and result metadata

**Files:**
- Create: `src/gameplay/HintService.ts`
- Modify: `src/profile/PlayerProfileService.ts`
- Modify: `src/campaign/types.ts`
- Modify: `src/campaign/CampaignService.ts`
- Modify: `src/scenes/GameScene.ts`
- Create: `src/dev/hintSanity.ts`

**Interfaces:**

```ts
export interface PuzzleHint {
  readonly x: number;
  readonly y: number;
  readonly state: CellState.Wall | CellState.Floor;
}
export function chooseHint(puzzle: PuzzleState): PuzzleHint | null;
```

Choose the first editable cell whose current state differs from the immutable solution state, using deterministic row-major order for v1. Hint UI highlights that cell and Wall/Floor tool; it does not call `setCellState`.

- [ ] **Step 1: Write failing hint sanity**

Assert fixed cells are never selected, already-correct cells are skipped, hint state matches solution, and solved board returns null.

- [ ] **Step 2: Implement free-hint accounting**

If `freeRemaining > 0`, decrement only when a hint is actually delivered; increment profile `totalUsed` and session `hintsUsed`.

- [ ] **Step 3: Record campaign results**

On solve persist best active time, minimum hints used for a solve, solve count, and `solvedWithoutHints` boolean in `campaign.levelResults[id]`.

- [ ] **Step 4: Update win overlay**

Show Solved, time, hints summary, new-record when best time improved, `To manuscript`, and `Next`. Keep finished board visible underneath. If `CampaignCompletionResult.unlockedManuscript` is non-null, show the manuscript-unlocked event after the ordinary solve result with `Open` and `Stay here`; do not grant currency.

- [ ] **Step 5: Run/commit**

```bash
npx tsx src/dev/hintSanity.ts
npm run sanity:puzzle-session
npm run sanity:campaign-runtime
npm run build
git add src/gameplay/HintService.ts src/profile src/campaign src/scenes/GameScene.ts src/dev/hintSanity.ts
git commit -m "feat: add free hints and level results"
```
