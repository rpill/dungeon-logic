# Tutorial v2 and Rules Reference Design

## Goal

Replace the current four tutorial puzzles with five purpose-built lessons that teach one rule at a time through deductions that are visible from the current board state. Rewrite the in-game rules reference to mirror the same logical order, while keeping controls/feedback separate from puzzle rules.

## Design principles

1. **Every guided action must be justified by the active rule from the visible board state.** Never target a Wall/Floor cell merely because it matches the hidden solution.
2. **Teach by action, not exposition.** One tutorial step = one short idea + one concrete action.
3. **No standalone modal tutorial messages.** Guidance stays attached to board-cell steps and advances automatically when the required action is complete.
4. **Floor is explicit notation, not a victory requirement.** Tutorial deliberately teaches Floor where it helps a deduction; the validator still completes a level from correct walls without requiring all remaining cells to be marked Floor.
5. **Use previously learned rules before introducing a new rule.** New rules appear only when they create a new deduction the player could not already make from simpler rules.
6. **Tutorial levels are authored teaching fixtures, not campaign-quality puzzles.** Small size and pedagogical clarity matter more than difficulty.
7. **Campaign remains exactly 30 levels.** Tutorial is a separate chapter before Campaign.

All five proposed solution grids below have been verified against the current `LevelValidator`: row clues, column clues, treasure-room rules, connectivity, monster dead ends, hallway width, and doors all validate as solved.

---

## Tutorial 1 — Numbers and Floor notation

**Purpose:** teach clue counts, zero clues, and that Floor is optional notation.

**Board:** 3×3

- Row clues: `0, 1, 0`
- Column clues: `0, 1, 0`
- Monsters: none
- Chests: none

Hidden solution:

```text
...
.#.
...
```

### Guided flow

1. Highlight row clue `0`.
   - Copy: `0 — стен в этой строке нет. Отметь клетки как ПОЛ.`
   - Action: mark row 0 Floor.
2. Highlight the second row clue `0`.
   - Copy: `Ещё один 0 — здесь тоже ПОЛ.`
   - Action: mark row 2 Floor.
3. Highlight column clue `0` on the left.
   - Copy: `Столбец 0 — оставшаяся клетка тоже ПОЛ.`
   - Action: mark `(0,1)` Floor.
4. Highlight column clue `0` on the right.
   - Copy: `Справа тоже 0 — оставшаяся клетка ПОЛ.`
   - Action: mark `(2,1)` Floor.
5. Highlight row clue `1`.
   - Copy: `Здесь нужна 1 СТЕНА. Осталась одна неизвестная клетка.`
   - Secondary short note: `ПОЛ — только удобная пометка. Для победы важны стены.`
   - Action: place Wall at `(1,1)`.
6. Correct wall placement immediately completes the puzzle.

No monsters, rooms, connectivity, or 2×2 concepts appear in Tutorial 1.

---

## Tutorial 2 — Monsters and dead ends

**Purpose:** teach both directions of the monster/dead-end rule, while making clue numbers the stated cause whenever the deduction actually comes from a clue.

**Board:** 5×5

- Row clues: `3, 1, 3, 1, 5`
- Column clues: `4, 1, 3, 3, 2`
- Monster: `(0,0)`
- Chests: none

Hidden solution:

```text
..###
#....
#.##.
#....
#####
```

### Guided flow

1. Highlight column clue `4` at x=0.
   - Copy: `В этом столбце должно быть 4 стены. Монстр не может быть стеной.`
   - Action: Walls at `(0,1..4)`.
2. Focus the monster and its right neighbor.
   - Copy: `У монстра должен остаться один выход. Остался только справа — ПОЛ.`
   - Action: Floor at `(1,0)`.
3. Highlight row clue `3` at y=0.
   - Copy: `В верхней строке нужны 3 стены. Две клетки уже не стены.`
   - Action: Walls at `(2,0)`, `(3,0)`, `(4,0)`.
4. Demonstrate the reverse dead-end rule at `(1,0)`.
   - Copy: `Тупик должен содержать монстра. Продолжение вниз должно остаться ПОЛОМ.`
   - Action: Floor at `(1,1)`.
5. Highlight row clue `1` at y=1.
   - Copy: `Одна стена уже стоит. Остальные клетки строки — ПОЛ.`
   - Action: Floor at `(2,1)`, `(3,1)`, `(4,1)`.
6. Highlight row clue `5` at y=4.
   - Copy: `5 — вся строка состоит из стен.`
   - Action: Walls across remaining unknown cells in row 4.
7. Highlight column clue `2` at x=4.
   - Copy: `В столбце уже есть 2 стены. Остальные клетки — ПОЛ.`
   - Action: Floor at `(4,2)`, `(4,3)`.
8. Highlight row clue `1` at y=3.
   - Copy: `Одна стена уже стоит. Остаток строки — ПОЛ.`
   - Action: Floor at remaining unknown cells in row 3.
9. Highlight column clue `1` at x=1.
   - Copy: `В столбце уже есть нужная стена. Остаток — ПОЛ.`
   - Action: Floor at `(1,2)`.
10. Highlight row clue `3` at y=2.
    - Copy: `Нужны 3 стены. Одна уже стоит, две клетки уже ПОЛ.`
    - Action: Walls at `(2,2)` and `(3,2)`.
11. Puzzle completes.

The first four walls are explicitly explained by clue `4`, not by the monster rule.

---

## Tutorial 3 — Connected Floor

**Purpose:** teach that all open cells must belong to one orthogonally connected area, and that diagonals do not connect areas.

**Board:** 5×4

- Row clues: `4, 2, 2, 2`
- Column clues: `1, 3, 1, 3, 2`
- Monsters: `(0,0)`, `(0,2)`, `(4,2)`
- Chests: none

Hidden solution:

```text
.####
...##
.#.#.
##...
```

### Guided flow

1. Row `4`: the top-left Monster is open, so the other four cells are Walls.
2. The top-left Monster now has one possible exit: mark `(0,1)` Floor.
3. Column `1` at x=0 can contain only one Wall, so `(0,3)` is Wall.
4. Monster `(0,2)` already exits upward; `(1,2)` must be Wall so it does not gain a second exit.
5. Column clue `1` at x=2 already has its Wall at `(2,0)`, so `(2,1..3)` are Floor.
6. **Introduce connectivity only now.**
   - The left open chain is blocked below by `(0,3)` and on the right by `(1,2)`.
   - `(2,1)` is already known Floor on the other side.
   - Copy: `Весь ПОЛ должен быть соединён. Если закрыть эту клетку, левая часть отрежется.`
   - Action: Floor at `(1,1)`.
   - Short note: `Диагональ клетки не соединяет.`
7. Row `2` at y=2 forces Wall at `(3,2)`.
8. Column `3` at x=1 then forces Wall at `(1,3)`.
9. Row `2` at y=3 already has its two Walls, so `(3,3)` and `(4,3)` are Floor.
10. Row `2` at y=1 forces the final Walls `(3,1)` and `(4,1)`; the puzzle completes.

The last required walls are deliberately kept until after the connectivity/Floor deductions so wall-only completion cannot skip the teaching step.

---

## Tutorial 4 — Corridor width / no open 2×2

**Purpose:** teach the no-open-2×2 rule outside treasure rooms only after three cells in the square are explicitly known Floor.

**Board:** 5×4

- Row clues: `3, 1, 1, 1`
- Column clues: `0, 3, 1, 2, 0`
- Monsters: `(0,0)`, `(4,0)`, `(0,3)`
- Chests: none

Hidden solution:

```text
.###.
.#...
...#.
.#...
```

### Guided flow

1. Column clue `0` at x=0: mark the ordinary cells `(0,1)` and `(0,2)` Floor.
2. Column clue `0` at x=4: mark `(4,1..3)` Floor.
3. Row clue `3` at y=0: the three cells between the Monsters are Walls.
4. Column clue `1` at x=2 already has its Wall at `(2,0)`: mark `(2,1..3)` Floor.
5. Bottom-left Monster already exits upward, so `(1,3)` must be Wall.
6. Row clue `1` at y=3 is already satisfied: `(3,3)` is Floor.
7. **Introduce 2×2 only now.**
   - In square `(3,2)`, `(4,2)`, `(3,3)`, `(4,3)`, three cells are visibly Floor.
   - Copy: `Вне комнаты открытого квадрата 2×2 быть не может.`
   - Action: Wall at `(3,2)`.
8. Row clue `1` at y=2 then forces `(1,2)` Floor.
9. Column clue `2` at x=3 is already satisfied, so `(3,1)` is Floor.
10. Column clue `3` at x=1 forces the final Wall `(1,1)`; the puzzle completes.

The no-2×2 rule is never explained against unknown/unmarked cells, and the last required Wall remains until after the Floor deduction that follows the 2×2 step.

---

## Tutorial 5 — Treasure room

**Purpose:** teach the 3×3 chest room and its single entrance after all previous rules are already familiar.

**Board:** 5×5

- Row clues: `2, 2, 2, 2, 4`
- Column clues: `2, 2, 1, 4, 3`
- Chest: `(0,0)`
- Monster: `(4,4)`

Hidden solution:

```text
...##
...##
...##
##...
####.
```

### Guided flow

1. Focus Chest `(0,0)`.
   - Copy: `Сундук находится в комнате ровно 3×3. Здесь положение комнаты может быть только одно.`
   - Action: mark the other eight cells of the top-left 3×3 as Floor.
2. Row clue `2` at y=0 forces Walls `(3,0)` and `(4,0)`.
3. Row clue `2` at y=1 forces Walls `(3,1)` and `(4,1)`.
4. Column clue `2` at x=0 forces Walls `(0,3)` and `(0,4)`.
5. Column clue `2` at x=1 forces Walls `(1,3)` and `(1,4)`.
6. Row clue `4` at y=4, with the Monster fixed open, forces Walls `(2,4)` and `(3,4)`.
7. Monster `(4,4)` now has one possible exit: mark `(4,3)` Floor.
8. Column clue `3` at x=4 forces Wall `(4,2)`.
9. Row clue `2` at y=3 is already satisfied by `(0,3)` and `(1,3)`: mark `(2,3)` and `(3,3)` Floor.
10. **Introduce the single entrance.**
    - The room already has its bottom entrance at `(2,3)`.
    - The only remaining unknown boundary cell is `(3,2)`.
    - Copy: `У комнаты ровно один вход. Внизу он уже ПОЛ — правую границу закрой СТЕНОЙ.`
    - Action: Wall at `(3,2)`; the puzzle completes.

This order deliberately leaves the final room-boundary Wall until after the Monster and entrance Floor deductions, preserving wall-only completion without skipping instruction.

---

## Tutorial completion

After Tutorial 5, show a short completion state only:

```text
ОБУЧЕНИЕ ПРОЙДЕНО
Ты знаешь все правила подземелья.

[ НАЧАТЬ ГЛАВУ I ]
```

The Home button may remain secondary. No additional explanatory paragraph appears here.

The game title must show `ОБУЧЕНИЕ N / 5` / `TUTORIAL N / 5`.

---

## Rules reference v2

The rules reference is ordered to match the tutorial and the original eight-page teaching sequence, but uses original Dungeon Logic copy.

### Puzzle rules — 8 cards

1. **Цель**
   - `Расставь стены так, чтобы одновременно выполнялись все правила. ПОЛ можно отмечать для удобства, но для победы это не обязательно.`
2. **Числа**
   - `Число слева — точное количество стен в строке. Число сверху — точное количество стен в столбце.`
3. **ПОЛ**
   - `Если клетка точно не является стеной, её можно отметить как ПОЛ. Это вспомогательная пометка — заполнять весь пол не требуется.`
4. **Комнаты**
   - `Каждый сундук находится в открытой комнате ровно 3×3. У комнаты один сундук и ровно один вход. Монстров внутри быть не может.`
5. **Монстры**
   - `У каждого монстра ровно один соседний проход. И наоборот: любой тупик коридора должен содержать монстра.`
6. **Связность**
   - `Весь проход образует одну общую область. Клетки соединяются только сторонами; диагональ не считается.`
7. **Коридоры**
   - `Вне комнаты с сундуком открытого блока 2×2 быть не может.`
8. **Завершение**
   - `Поставь все стены правильно — уровень завершится автоматически. Отмечать весь оставшийся ПОЛ не нужно.`

Equivalent concise English copy is required.

### Separate utility section — not puzzle rules

After the eight rules, display a separate `УПРАВЛЕНИЕ / CONTROLS` section containing:

- Desktop input: LMB Wall, RMB Floor, drag support.
- Touch input: choose Wall/Floor, then tap/drag.
- Undo and Reset.
- Hint behavior summary.
- Red highlight meaning: visible contradiction only; the game is not comparing every move to the hidden solution.

Controls and feedback must not be numbered as puzzle-rule pages.

---

## Data/model changes

1. Add `tutorial-005` to `TutorialLevelId`.
2. Expand `TutorialLevelEntry.slot` to `1 | 2 | 3 | 4 | 5`.
3. Add `tutorial005.ts` and append it to `TUTORIAL_MANIFEST`.
4. Replace Tutorial 2–4 authored levels with the exact boards in this spec; Tutorial 1 remains the 3×3 board above; Tutorial 5 is new.
5. Replace RU/EN onboarding flows with the action sequence above.
6. Update all tutorial-count UI and sanity expectations from 4 to 5.

### Profile migration

Existing profiles must not be relocked by the new fifth tutorial.

- Fresh profile: Tutorial is incomplete until all five levels are completed.
- Existing profile with `tutorial.completed === true` from the old four-level version: normalize as fully tutorial-complete and treat `tutorial-005` as completed for progression purposes.
- Existing partial profile: preserve known completed levels; `tutorial-005` remains locked until Tutorial 4 is complete.
- Existing active Tutorial puzzle IDs remain valid for 001–004; 005 is added as a new valid ID.

This migration must be deterministic and covered by profile sanity tests.

---

## Regression requirements

Automated sanity must verify at least:

1. Tutorial manifest has exactly five stable IDs in order.
2. Every hidden solution passes `LevelValidator`.
3. Each Tutorial onboarding action matches the hidden solution for its targeted cells.
4. Tutorial 2's first four walls are guided by column clue `4`; the monster rule is introduced only on the exit Floor step.
5. Tutorial 3's connectivity step occurs only after the left region is visibly blocked below/right and a known Floor region exists on the other side of the bridge.
6. Tutorial 4's 2×2 step occurs only after the other three cells in that exact square have already been guided to Floor.
7. Tutorial 5 marks the eight non-chest room cells Floor before teaching the room entrance.
8. No Tutorial uses standalone message steps or requires clicking the tutorial text to advance.
9. Guided text never blocks normal board interaction by itself; progression is action-driven.
10. Completing Tutorial 5 unlocks Campaign; completing Tutorial 4 alone does not for fresh profiles.
11. Legacy profiles already marked Tutorial-complete remain Campaign-unlocked after normalization.
12. Rules reference presents eight puzzle-rule cards in the specified order and keeps controls/feedback separate.
13. RU and EN tutorial titles show `/ 5`.
14. `npm run build` and release sanity remain green.

