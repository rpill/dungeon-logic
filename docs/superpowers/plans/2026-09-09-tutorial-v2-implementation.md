# Tutorial v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four current tutorial fixtures with five pedagogically-authored lessons, migrate tutorial progress safely, and reorder the rules reference to the same eight-rule teaching sequence.

**Architecture:** Tutorial content stays data-driven: five `LevelDefinition` fixtures plus action-driven `OnboardingFlow` steps. `TutorialService` continues to derive progression from the manifest length. Profile normalization owns the one-time compatibility rule for profiles that were already tutorial-complete under the old four-level version. The help model separates eight puzzle-rule cards from a controls/feedback section so `HelpScene` can render them distinctly.

**Tech Stack:** TypeScript 6, Phaser 4, existing `LevelValidator`, `PuzzleState`, sanity scripts run with `tsx`, Vite build.

**Spec:** `docs/superpowers/specs/2026-09-09-tutorial-v2-design.md`

## Global Constraints

- Tutorial is a separate chapter; Campaign remains exactly 30 levels.
- Guided actions are justified by the visible board state and advance automatically.
- No standalone tutorial message steps.
- Floor is notation, not a win requirement.
- Fresh profiles must complete all five tutorial levels before Campaign.
- Profiles already marked tutorial-complete before this change remain Campaign-unlocked.
- Rules reference contains exactly eight puzzle-rule cards in tutorial order; controls/feedback are separate utilities.

---

### Task 1: Five tutorial fixtures and manifest

**Files:**
- Modify: `src/content/tutorial/types.ts`
- Modify: `src/content/tutorial/manifest.ts`
- Modify: `src/content/tutorial/levels/tutorial002.ts`
- Modify: `src/content/tutorial/levels/tutorial003.ts`
- Modify: `src/content/tutorial/levels/tutorial004.ts`
- Create: `src/content/tutorial/levels/tutorial005.ts`
- Test: `src/dev/tutorialSanity.ts`

**Interfaces:**
- Produces `TutorialLevelId = tutorial-001..tutorial-005` and ordered `TUTORIAL_MANIFEST` slots 1..5.
- Every fixture exposes a `LevelDefinition` whose hidden solution validates with `LevelValidator`.

- [ ] **Step 1: Write failing manifest/validator assertions**

Update `tutorialSanity.ts` so it expects IDs `tutorial-001` through `tutorial-005`, length 5, validates each hidden solution, and asserts Campaign is still 30 levels.

- [ ] **Step 2: Run the sanity and verify RED**

Run: `npx tsx src/dev/tutorialSanity.ts` when local dependencies are available; otherwise run the existing JS/transpile fallback and verify the source assertions fail against the four-level manifest.

Expected: failure because `tutorial-005` is absent and manifest length is 4.

- [ ] **Step 3: Replace/create exact fixtures from the approved spec**

Use these exact hidden solutions:

```text
T1 3x3: ... / .#. / ...
T2 5x5: ..### / #.... / #.##. / #.... / #####
T3 5x4: .#### / ...## / .#.#. / ##...
T4 5x4: .###. / .#... / ...#. / .#...
T5 5x5: ...## / ...## / ...## / ##... / ####.
```

Use the exact row/column clues, monsters and chest coordinates from the spec.

- [ ] **Step 4: Run tutorial fixture sanity and verify GREEN**

Expected: manifest and validator assertions pass.

---

### Task 2: Action-driven tutorial flows

**Files:**
- Modify: `src/onboarding/OnboardingFlow.ts`
- Modify: `src/dev/onboardingSanity.ts`
- Modify: `src/dev/tutorialSanity.ts`

**Interfaces:**
- `createOnboardingFlow(id, language)` returns only `board-cells` steps.
- Every target cell uses `CellState.Wall` or `CellState.Floor` matching the hidden solution.

- [ ] **Step 1: Write failing pedagogical-order assertions**

Add assertions for:

```text
T2: first step = column clue 4, Walls (0,1..4); next monster action = Floor (1,0).
T3: connectivity Floor (1,1) occurs only after Wall (0,3), Wall (1,2), and Floor (2,1).
T4: 2x2 Wall (3,2) occurs only after Floor (4,2), Floor (3,3), Floor (4,3).
T5: eight non-chest cells in top-left 3x3 are guided Floor before entrance Floor (2,3).
```

Also assert no standalone message target exists and that each tutorial guides all required solution walls without false walls.

- [ ] **Step 2: Run onboarding/tutorial sanity and verify RED**

Expected: failures against the current hand-authored Tutorial 2–4 flow and missing Tutorial 5 flow.

- [ ] **Step 3: Replace RU flows with approved deduction order**

Implement exactly the spec sequence. Example first T2 steps:

```ts
{
  target: 'board-cells',
  expectedState: CellState.Wall,
  guideClue: { axis: 'column', index: 0 },
  cells: [{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:0,y:4}],
  message: 'В этом столбце должно быть 4 стены. Монстр не может быть стеной.',
},
{
  target: 'board-cells',
  expectedState: CellState.Floor,
  cells: [{x:1,y:0}],
  focusCells: [{x:0,y:0}],
  message: 'У монстра должен остаться один выход. Остался только справа — ПОЛ.',
},
```

- [ ] **Step 4: Add concise equivalent EN messages**

English copy must preserve the reason for each deduction, not merely translate cell instructions.

- [ ] **Step 5: Run onboarding/tutorial sanity and verify GREEN**

Also replay each sequence into `PuzzleState`: it must not solve before the final guided action and must solve on the final action.

---

### Task 3: Five-level profile migration and progression

**Files:**
- Modify: `src/profile/PlayerProfile.ts`
- Modify: `src/dev/playerProfileSanity.ts`
- Modify: `src/dev/tutorialSanity.ts`

**Interfaces:**
- `normalizePlayerProfile()` accepts active Tutorial puzzle IDs 001..005.
- Old persisted `tutorial.completed === true` normalizes to all five completed IDs.
- Partial old profiles preserve only their completed IDs; Tutorial 5 remains locked until Tutorial 4 completes.

- [ ] **Step 1: Write failing migration assertions**

Create a schema-v2 legacy profile with:

```ts
tutorial: {
  completedLevelIds: ['tutorial-001','tutorial-002','tutorial-003','tutorial-004'],
  completed: true,
  activePuzzle: null,
}
```

Assert normalized `completedLevelIds` includes `tutorial-005` and Campaign remains unlocked. Also assert a partial profile ending at Tutorial 4 but `completed:false` does not receive 005 automatically.

- [ ] **Step 2: Run profile sanity and verify RED**

Expected: old completed profile has only four completed IDs.

- [ ] **Step 3: Expand tutorial IDs and normalize legacy-complete state**

Set `TUTORIAL_IDS` to all five IDs. In `normalizeTutorial()`, if persisted `raw.completed === true`, return all five IDs and `completed:true`; otherwise preserve known completed IDs and require all five for completion.

- [ ] **Step 4: Run profile/tutorial sanity and verify GREEN**

Assert a fresh profile unlocks Campaign after Tutorial 5, not Tutorial 4.

---

### Task 4: Rules reference v2 and separate controls section

**Files:**
- Modify: `src/help/HelpRules.ts`
- Modify: `src/scenes/HelpScene.ts`
- Modify: `src/dev/helpRulesSanity.ts`

**Interfaces:**
- `getHelpRules(language)` returns exactly eight puzzle rules in order: `goal, clues, floor, treasure-room, monsters, connectivity, open-2x2, completion`.
- `getHelpUtilities(language)` returns controls and feedback entries separately.

- [ ] **Step 1: Write failing rules-order/separation assertions**

Assert eight puzzle IDs exactly match the required sequence, controls/feedback are absent from the puzzle-rule list, and utility entries contain controls plus red-highlight feedback.

- [ ] **Step 2: Run help sanity and verify RED**

Expected: current rules list intermixes controls/feedback and lacks Floor/completion cards.

- [ ] **Step 3: Implement RU/EN rules and utilities**

Use the approved concise wording. Add `floor` and `completion` IDs; keep `controls` and `feedback` only in the utility array.

- [ ] **Step 4: Render utility section separately in HelpScene**

After the eight rule cards, render a non-numbered `УПРАВЛЕНИЕ / CONTROLS` section heading, then utility cards. Keep the existing scroll behavior.

- [ ] **Step 5: Run help sanity and verify GREEN**

---

### Task 5: Tutorial completion/title regression and final verification

**Files:**
- Modify: `src/i18n/UiCopy.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/dev/localizationSanity.ts`
- Modify: `src/dev/gameRegressionSanity.ts`
- Modify: `CURRENT_STATE.md`
- Modify: `TECH.md`

**Interfaces:**
- Tutorial title derives `/ 5` from manifest/service count.
- Final Tutorial completion state reads `ОБУЧЕНИЕ ПРОЙДЕНО\nТы знаешь все правила подземелья.` / English equivalent and offers `НАЧАТЬ ГЛАВУ I`.

- [ ] **Step 1: Write failing localization/completion assertions**

Assert completion copy contains both title and short body, and regressions refer to Tutorial 5 rather than Tutorial 4.

- [ ] **Step 2: Update completion copy and stale regression/docs text**

Keep the existing `startChapterOne` action; only update player-facing completion copy and stale comments/assertions.

- [ ] **Step 3: Run targeted sanity suite**

Run:

```bash
npm run sanity:tutorial
npm run sanity:onboarding
npm run sanity:profile
npm run sanity:help-rules
npm run sanity:i18n
npm run sanity:game-regressions
```

Expected: all pass.

- [ ] **Step 4: Run full build and release sanity**

Run:

```bash
npm run build
npm run sanity:release
```

Expected: TypeScript/Vite build succeeds and release acceptance has zero failures.

- [ ] **Step 5: Package and verify the product ZIP**

Create a ZIP excluding `node_modules`, `dist`, `.git`, temporary work files, and previous ZIPs. Unpack into a fresh directory and rerun the available targeted sanities/build on the unpacked copy. Compute SHA256 only after this verification.
