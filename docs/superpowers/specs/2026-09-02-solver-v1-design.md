# Dungeon Logic — Solver v1 Design

## Goal

Добавить первый автоматический solver для Dungeon Logic, который принимает корректный `LevelDefinition`, определяет количество различных решений и останавливает поиск после второго найденного решения.

Solver нужен как фундамент для проверки уникальности вручную созданных уровней, будущего generator и будущей оценки качества уровней. Solver v1 не является системой подсказок и не анализирует текущее состояние игрока.

---

# 1. Scope

Solver v1:

- работает только от `LevelDefinition`;
- не принимает текущий `PuzzleState` игрока;
- не зависит от Phaser, UI или `GameScene`;
- поддерживает текущие dungeon rules;
- учитывает Monster, Chest, Fixed Blocker и Directional Door;
- считает уникальность только по конечной раскладке обычных клеток `WALL / OPEN`;
- прекращает поиск сразу после второго найденного решения;
- ориентирован на обычные уровни размером до 10×10;
- использует существующий `LevelValidator` как финальный источник истины.

Целевая производительность v1:

- обычный корректный уровень до 10×10 должен проверяться примерно за 1 секунду или быстрее на dev-машине;
- это целевой бюджет, а не жёсткий wall-clock assertion в sanity checks.

---

# 2. Public API

```ts
solveLevel(
  level: LevelDefinition,
): SolveResult
```

```ts
interface SolveResult {
  solutionCount: 0 | 1 | 2;
  firstSolution:
    | readonly string[]
    | null;
}
```

Семантика `solutionCount`:

- `0` — решений нет;
- `1` — найдено ровно одно решение;
- `2` — найдено как минимум два решения.

`2` означает `2+`. После второго принятого решения solver обязан немедленно остановить дальнейший поиск.

`firstSolution`:

- `null`, если `solutionCount === 0`;
- содержит первое найденное валидное решение, если `solutionCount` равен `1` или `2`.

Формат `firstSolution`:

```text
# = ordinary clue-counted WALL
. = non-wall
```

Fixed Blocker, Monster, Chest и Directional Door не кодируются отдельными символами в `firstSolution`; их семантика остаётся в metadata `LevelDefinition`.

---

# 3. Meaning of a unique solution

Два решения считаются разными только тогда, когда отличается хотя бы одна обычная mutable-клетка: в одном решении она `WALL`, а в другом `OPEN`.

Внутренние варианты интерпретации Treasure Room не создают отдельные решения. Если одна и та же итоговая раскладка `WALL / OPEN` допускает несколько эквивалентных внутренних room interpretations, это одно решение.

---

# 4. Malformed level vs unsolvable level

Solver различает malformed `LevelDefinition` и корректно сформированный, но неразрешимый puzzle.

Если существующая structural validation проекта обнаруживает некорректные level metadata, например пересечение fixed objects или fixed object за пределами поля, ошибка не преобразуется в `solutionCount: 0`. Solver позволяет этой ошибке быть выброшенной наружу.

Если `LevelDefinition` структурно корректен, но constraints невозможно удовлетворить:

```ts
{
  solutionCount: 0,
  firstSolution: null,
}
```

---

# 5. Architecture

```text
LevelDefinition
      ↓
PuzzleSolver
      ↓
SearchState
      ↓
propagation
      ↓
partial pruning
      ↓
complete WALL / OPEN assignment
      ↓
PuzzleState
      ↓
LevelValidator
      ↓
SolveResult
```

Предлагаемая структура:

```text
src/puzzle/solver/
├── PuzzleSolver.ts
├── SearchState.ts
└── types.ts
```

`PuzzleSolver.ts` отвечает за публичный `solveLevel()`, initialization поиска, propagation loop, DFS/backtracking, выбор следующей клетки, остановку после второго решения, передачу полного candidate в `LevelValidator` и сохранение `firstSolution`.

`SearchState.ts` отвечает за внутреннее partial-состояние поиска, row/column counts, mutable cells, assignment/rollback и данные для дешёвых pruning checks.

`types.ts` содержит `SolveResult` и solver-specific search/debug types.

Solver modules не импортируют Phaser.

---

# 6. Search cell semantics

Existing runtime `PuzzleState` нельзя использовать как partial search state, потому что `PuzzleState.UNKNOWN` в текущей игровой логике считается OPEN, а solver должен отличать «клетка ещё не назначена» от «клетка точно OPEN».

SearchState использует собственные три состояния:

```text
UNASSIGNED
WALL
OPEN
```

Из-за `erasableSyntaxOnly` для них не используется TypeScript `enum`.

---

# 7. Initial state

При старте solver строит SearchState из `LevelDefinition`.

- Monster → OPEN;
- Chest → OPEN;
- Directional Door → OPEN;
- Fixed Blocker → CLOSED metadata, не `WALL`;
- ordinary mutable cell → UNASSIGNED.

Solver выполняет branching только по обычным mutable cells.

Fixed Blocker никогда не становится `WALL`, не входит в row/column wall clue count и не становится branch candidate.

---

# 8. Final validation

Partial pruning не является второй полной реализацией dungeon rules.

Когда все ordinary mutable cells получили значение `WALL` или `OPEN`, solver:

1. создаёт обычный `PuzzleState(level)`;
2. выставляет ordinary `WALL` клетки;
3. оставляет все остальные обычные клетки non-wall;
4. запускает существующий `LevelValidator`;
5. принимает candidate как решение только при `result.isSolved === true`.

`LevelValidator` остаётся финальным источником истины.

Solver не использует `level.solution` для поиска, pruning, определения валидности или определения уникальности.

---

# 9. Search algorithm

```text
initialize SearchState
        ↓
propagate forced assignments
        ↓
run safe partial pruning
        ↓
complete?
   yes → LevelValidator
   no
        ↓
choose most constrained cell
        ↓
try WALL
        ↓
backtrack
        ↓
try OPEN
```

DFS полностью детерминирован. При одинаковом уровне solver должен получать одинаковый порядок поиска и одинаковый `firstSolution`.

---

# 10. Propagation

Перед branching solver повторяет простые deterministic deductions до fixed point.

## Row / column propagation

Для каждой строки и столбца отслеживаются:

```text
targetClue
wallsPlaced
unassignedWallCandidates
```

Если `wallsPlaced === targetClue`, все оставшиеся ordinary UNASSIGNED клетки этой линии становятся OPEN.

Если `wallsPlaced + unassignedWallCandidates === targetClue`, все оставшиеся ordinary UNASSIGNED candidates становятся WALL.

Propagation повторяется до тех пор, пока forced assignments продолжают появляться.

## Directional Door propagation

Horizontal Door:

```text
  WALL
OPEN D OPEN
  WALL
```

Принуждает left/right → OPEN, up/down → ordinary WALL.

Vertical Door:

```text
  OPEN
WALL D WALL
  OPEN
```

Принуждает up/down → OPEN, left/right → ordinary WALL.

Если required assignment конфликтует с fixed metadata или уже назначенным состоянием, ветка невозможна. Fixed Blocker не может удовлетворять required ordinary WALL вокруг Directional Door.

---

# 11. Safe partial pruning

V1 использует только pruning, который не может удалить настоящее решение.

## 11.1 Row / column feasibility

Ветка отбрасывается, если:

```text
wallsPlaced > targetClue
```

или:

```text
wallsPlaced + unassignedWallCandidates < targetClue
```

Blocker и fixed OPEN cells не входят в `unassignedWallCandidates`.

## 11.2 Directional Door feasibility

Horizontal: left/right OPEN, up/down ordinary WALL.

Vertical: up/down OPEN, left/right ordinary WALL.

Door на edge остаётся невозможным согласно существующему validator rule.

## 11.3 Potential connectivity

Для partial connectivity:

- assigned OPEN и fixed OPEN — обязательное открытое пространство;
- UNASSIGNED ordinary cells — потенциально OPEN;
- ordinary WALL и Fixed Blocker — непроходимы.

Если обязательные OPEN cells нельзя соединить даже через все оставшиеся UNASSIGNED cells, ветка отбрасывается.

Solver не требует, чтобы partial state уже был connected; connectivity должна лишь оставаться достижимой.

## 11.4 Treasure Room candidate feasibility

Для каждого Chest solver формирует все геометрически допустимые 3×3 positions, содержащие этот Chest.

Candidate перестаёт быть возможным, если внутри его 3×3 появляется или уже существует несовместимое состояние:

- ordinary assigned WALL;
- Fixed Blocker;
- Directional Door;
- другой Chest, нарушающий правило ровно одного Chest в комнате.

Fixed metadata, которое existing Treasure Room rules уже запрещают внутри комнаты, также может исключать candidate статически.

Если хотя бы для одного Chest не осталось ни одного возможного Treasure Room candidate, ветка отбрасывается.

Solver v1 не обязан partial-проверять точное число entrances комнаты.

---

# 12. Rules intentionally left to full validation

В первой версии solver не реализует агрессивный partial pruning для:

- Monster dead-end rule;
- правила «каждый hallway dead end содержит Monster»;
- open 2×2 outside Treasure Rooms;
- точного количества Treasure Room entrances;
- полного выбора совместимого набора нескольких Treasure Rooms.

Эти правила проверяет `LevelValidator` на complete candidate.

Если profiling покажет bottleneck, безопасные partial checks добавляются позже.

---

# 13. Branch selection

Используется deterministic `most constrained first` heuristic.

Приоритет клетки увеличивается, если она:

1. находится в строке, близкой к принудительному выполнению clue;
2. находится в столбце, близком к принудительному выполнению clue;
3. связана с Directional Door constraints;
4. входит в ограниченное число оставшихся Treasure Room candidates.

При одинаковом score используется стабильный tie-break `y → x`.

---

# 14. Branch order

После выбора клетки solver пробует:

1. `WALL`;
2. `OPEN`.

Порядок фиксирован и не использует randomness.

---

# 15. Early stop

После первого принятого решения:

- сохраняется `firstSolution`;
- поиск продолжается.

После второго:

- `solutionCount` становится `2`;
- recursion немедленно разворачивается до `solveLevel()`;
- дополнительные решения не перечисляются.

Solver не обязан узнавать точное количество решений после двух.

---

# 16. Debug performance data

Внутренне solver может собирать:

```ts
interface SolveStats {
  visitedNodes: number;
  elapsedMs: number;
}
```

`SolveStats` не входит в публичный `SolveResult` v1. Stats используются только для local profiling.

---

# 17. Testing strategy

Solver получает отдельные dev sanity checks, например:

```text
src/dev/solverSanity.ts
```

Минимальное покрытие:

- `level001` → ровно одно решение;
- `level002` → зафиксировать фактически найденный solution count;
- `level003` → зафиксировать фактически найденный solution count;
- `level004` → корректно учитываются Fixed Blocker и Directional Door;
- structurally valid unsolvable fixture → `solutionCount: 0`;
- ambiguous fixture → `solutionCount: 2`;
- malformed fixed metadata → throw, а не `0`;
- `firstSolution` положительного fixture проходит `LevelValidator`;
- `firstSolution === null` при `0`;
- solver никогда не возвращает значение выше `2`;
- implementation имеет hard stop после второго принятого решения.

Existing validator sanity checks продолжают работать независимо.

---

# 18. Performance verification

Для 10×10 не добавляется flaky automated assertion вида `elapsedMs < 1000`.

Цель `~1 second` проверяется локальным benchmark/debug stats на representative levels.

Если обычные 10×10 значительно превышают бюджет:

1. профилировать;
2. определить source branching;
3. добавить только доказуемо безопасный pruning;
4. повторно измерить.

Не переходить к SAT/SMT или сложному CSP engine без доказанной необходимости.

---

# 19. Out of scope

Solver v1 не включает:

- solving текущего `PuzzleState` игрока;
- hints;
- logical explanation steps;
- difficulty rating;
- generator;
- automatic level mutation;
- Phaser UI;
- dev button в `GameScene`;
- Yandex Games integration;
- exact enumeration свыше двух решений;
- SAT/SMT dependency;
- randomness;
- использование hidden `level.solution` как oracle.

---

# 20. Future extensions

После стабильного v1 тот же core сможет использоваться для uniqueness check в level-production pipeline, generator acceptance/rejection, batch validation и поиска pathological levels.

Отдельный будущий logical solver для hints/difficulty может использовать constraint propagation глубже, но не является требованием v1.

---

# 21. Acceptance criteria

Solver v1 считается готовым, когда:

- существует pure TypeScript `solveLevel(level)`;
- публичный результат имеет `solutionCount: 0 | 1 | 2`;
- `2` означает `2+`;
- `firstSolution` возвращается для положительного результата;
- malformed fixed metadata приводит к error;
- valid unsolvable level возвращает `0`;
- uniqueness считается по конечному WALL/OPEN layout;
- Monster, Chest, Blocker и Door учитываются корректно;
- row/column propagation работает;
- door propagation работает;
- row/column feasibility pruning работает;
- potential-connectivity pruning работает;
- Treasure Room candidate pruning работает;
- DFS deterministic;
- most-constrained-first используется для branch selection;
- branch order фиксирован как WALL → OPEN;
- каждое полное принятое решение подтверждается `LevelValidator`;
- `level.solution` не используется как oracle;
- поиск прекращается после второго решения;
- existing runtime gameplay не зависит от solver;
- ordinary levels до 10×10 имеют целевой бюджет около 1 секунды;
- existing validator sanity suite остаётся рабочим.
