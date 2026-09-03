# Dungeon Logic — Current State

Этот файл описывает текущее фактическое состояние прототипа.

Главный документ с правилами и направлением проекта:

`PROJECT.md`

Технические решения:

`TECH.md`

Структура проекта:

`TREE.txt`

---

# Implemented

## Project bootstrap

- Vite;
- TypeScript;
- Phaser;
- BootScene;
- GameScene;
- Phaser canvas 1280×720;
- FIT scaling;
- pixel-art rendering settings;
- browser context menu disabled для игрового input.

---

## Puzzle model

Реализован `PuzzleState`.

Состояния обычной изменяемой клетки:

- `UNKNOWN`;
- `WALL`;
- `FLOOR`.

`FLOOR` является пользовательской вспомогательной отметкой.

Для логики решения:

- `WALL` считается закрытой обычной стеной;
- `UNKNOWN` и `FLOOR` считаются открытым пространством;
- Fixed Blocker является отдельной CLOSED-клеткой через metadata и не превращается в обычный `WALL`;
- Monster, Chest и Directional Door являются fixed OPEN cells.

Игроку не требуется вручную отмечать `FLOOR` на всех свободных клетках для завершения уровня.

---

## Fixed gameplay objects

Поддерживаются четыре типа заранее известных объектов:

- Monster;
- Chest;
- Fixed Blocker;
- Directional Door.

Одна клетка не может одновременно содержать несколько fixed gameplay objects.

Запрещены пересечения:

- blocker + door;
- blocker + monster;
- blocker + chest;
- door + monster;
- door + chest;
- monster + chest.

Все fixed cells нельзя изменить обычным игровым input.

---

## Monster

Monster является fixed OPEN cell.

Игрок не может:

- поставить на него стену;
- стереть его;
- изменить его состояние через обычный input.

Dungeon rule:

- каждый monster должен находиться в hallway dead end;
- каждый hallway dead end должен содержать monster.

В текущем placeholder rendering monster отображается:

`M`

---

## Chest

Chest является fixed OPEN cell.

Игрок не может:

- поставить на него стену;
- стереть его;
- изменить его состояние через обычный input.

Chest используется для определения возможного положения Treasure Room.

Treasure Room:

- имеет размер 3×3;
- полностью состоит из OPEN cells;
- содержит ровно один chest;
- имеет ровно один entrance.

Chest может находиться в любой клетке комнаты 3×3 по core rules.

Для вручную собранного контента действует отдельный readability guideline, который не является правилом `LevelValidator`: сундук не ставится прямо в линию входа в Treasure Room. Для diversity-batch `level005–level012` sanity check требует, чтобы каждый Chest находился минимум в двух ортогональных шагах от внутренней клетки единственного entrance своей комнаты. Это оставляет свободу размещения внутри 3×3, но визуально уводит сундук из дверного прохода.

Положение Treasure Room не хранится в `LevelDefinition` напрямую и определяется валидатором по текущему состоянию поля.

В текущем placeholder rendering chest отображается:

`C`

---

## Fixed Blocker

Fixed Blocker — заранее известная непроходимая клетка.

Он:

- находится на поле с начала уровня;
- является immutable;
- считается CLOSED для dungeon topology;
- не входит в row/column wall clues;
- не входит в общую connected open area;
- разрывает открытые 2×2;
- не считается open neighbor при проверке dead ends;
- не является обычным `WALL`.

Blocker не должен использоваться вместо скрытой стены, которую обязан определить игрок.

В будущем один логический `BLOCKER` может визуально отображаться разными ORYX-объектами:

- ящик;
- бочка;
- камень;
- колонна;
- завал;
- пропасть;
- другой подходящий dungeon object.

В текущем placeholder rendering blocker отображается:

`X`

---

## Directional Door

Directional Door — заранее известная immutable OPEN cell с фиксированной ориентацией.

Поддерживаются:

- `horizontal`;
- `vertical`.

Door:

- всегда является OPEN;
- участвует в общей connectivity;
- участвует в подсчёте open neighbors;
- участвует в monster / dead-end topology;
- участвует в проверке открытых 2×2;
- не входит в row/column wall clues;
- не может находиться на внешнем краю поля;
- не может находиться внутри Treasure Room.

### Horizontal Door

Для horizontal door:

- клетка слева обязана быть OPEN;
- клетка справа обязана быть OPEN;
- клетка сверху обязана быть обычной `WALL`;
- клетка снизу обязана быть обычной `WALL`.

Схема:

```text
  #
. D .
  #
```

Две перпендикулярные стены являются обычными clue-counted WALL cells.

Fixed Blocker не может заменять одну из этих стен.

### Vertical Door

Для vertical door:

- клетка сверху обязана быть OPEN;
- клетка снизу обязана быть OPEN;
- клетка слева обязана быть обычной `WALL`;
- клетка справа обязана быть обычной `WALL`.

Схема:

```text
  .
# D #
  .
```

Fixed Blocker не может заменять одну из этих стен.

### Door и Treasure Room

Door не может находиться внутри комнаты 3×3.

При этом door может находиться сразу снаружи Treasure Room и быть её единственным входом, если одновременно выполняется directional rule двери.

В текущем placeholder rendering:

- horizontal door — `↔`;
- vertical door — `↕`.

---

## Level data

Реализован формат `LevelDefinition`.

Уровень содержит:

- id;
- width;
- height;
- row clues;
- column clues;
- monster positions;
- chest positions;
- blocker positions;
- directional doors;
- hidden solution для разработки.

Directional Door хранит:

- position;
- orientation: `horizontal` или `vertical`.

`solution` хранит только обычную структуру WALL / non-WALL.

Fixed Blocker не кодируется как `#` в hidden solution, потому что blocker не является clue-counted wall и хранится отдельно в metadata.

Уровень может не содержать Treasure Room.

Допустимо:

```ts
chests: []
```

В этом случае все OPEN cells рассматриваются как hallway space, а правило запрещённых открытых 2×2 действует на всём поле.

---

## Test levels

Сейчас зарегистрировано двенадцать вручную заданных dev-уровней.

### level001

- 6×6;
- один monster;
- один chest;
- одна Treasure Room;
- базовый тест dungeon rules.

### level002

- 6×6;
- другой layout hallway / Treasure Room;
- по сложности всё ещё близок к level001.

### level003

- 7×7;
- проверяет работу puzzle-core и rendering на другом размере поля;
- один monster;
- один chest.

### level004

Первый интегрированный уровень со Static Field Mechanics.

Характеристики:

- 6×6;
- два monsters;
- `chests: []`;
- без Treasure Room;
- один Fixed Blocker;
- одна horizontal Directional Door.

Blocker расположен отдельно от двери и не заменяет одну из framing walls.

Directional Door требует две обычные стены по перпендикулярной оси.

### level005–level012

Технический diversity-batch базовой Monster / Chest механики.

Общие ограничения батча:

- используются только Monster и Chest;
- `blockers: []`;
- `doors: []`;
- размеры 6×6, 7×7 и 8×8;
- есть уровни только с monsters;
- есть уровни только с chests;
- есть смешанные Monster + Chest уровни;
- поддерживаются layouts с одной и двумя Treasure Rooms;
- все зарегистрированные уровни проходят Solver v1 с `solutionCount === 1`;
- Chest placement в `level005–level012` дополнительно проходит authored-content sanity: сундук не может стоять ближе двух ортогональных шагов к внутренней клетке единственного entrance Treasure Room.

Этот placement guideline является правилом ручного контента, а не новым dungeon rule: `LevelValidator` по-прежнему разрешает Chest в любой клетке валидной комнаты 3×3.

Текущая структура батча после quality-pass:

- `level005` — 6×6, Monster-only;
- `level006` — 7×7, Chest-only, одна Treasure Room;
- `level007` — 7×7, Monsters + одна Treasure Room;
- `level008` — 7×7, две Treasure Rooms без monsters;
- `level009` — 7×7, Monster-only;
- `level010` — 8×8, Monsters + одна Treasure Room;
- `level011` — 8×8, две Treasure Rooms без monsters;
- `level012` — 8×8, Monsters + две Treasure Rooms.

Батч не является финальной progression-кривой и остаётся вручную заданным reference-набором для сравнения с результатами Generator v1.

---

## Dev level selection

Для временного переключения уровня используется query parameter:

`?level=1` … `?level=12`

Некорректный или отсутствующий номер приводит к fallback на `level001`.

Это временная dev-система.

Она не является финальной campaign progression или level selection.

---

## Board rendering

Реализованы:

- `BoardView`;
- `CellView`;
- row clues;
- column clues;
- отображение WALL;
- отображение FLOOR mark;
- отображение fixed gameplay objects.

Размер поля не захардкожен как 6×6.

Board rendering использует:

`LevelDefinition.width`

и

`LevelDefinition.height`

Текущие уровни проверяют:

- 6×6;
- 7×7;
- 8×8.

Placeholder markers:

- `M` — Monster;
- `C` — Chest;
- `X` — Fixed Blocker;
- `↔` — horizontal Directional Door;
- `↕` — vertical Directional Door.

Fixed cells не являются интерактивными.

Визуальный стиль пока технический placeholder.

ORYX ещё не подключён к игровому полю.

---

## Mouse input

### Left Mouse Button

ЛКМ:

- ставит `WALL`;
- повторное применение к `WALL` стирает стену.

Если drag начинается не на `WALL`:

- drag рисует стены.

Если drag начинается на `WALL`:

- drag стирает существующие стены;
- другие состояния во время стирающего мазка не меняются.

Fixed gameplay objects игнорируют обычное редактирование.

### Right Mouse Button

ПКМ:

- ставит `FLOOR`;
- повторное применение к `FLOOR` стирает отметку.

Если drag начинается не на `FLOOR`:

- drag рисует FLOOR marks.

Если drag начинается на `FLOOR`:

- drag стирает существующие FLOOR marks;
- другие состояния во время стирающего мазка не меняются.

Fixed gameplay objects игнорируют обычное редактирование.

### Drag behavior

В рамках одного drag-жеста:

- одна клетка обрабатывается максимум один раз;
- повторный проход курсора через клетку не переключает состояние повторно;
- fixed cells не изменяются.

Browser context menu отключён.

---

## Row / column clue feedback

Clues обновляются в реальном времени.

Clue считает только обычные `WALL`.

Не входят в clue count:

- Monster;
- Chest;
- Fixed Blocker;
- Directional Door;
- другие fixed cells.

### Constraint incomplete

Цифра отображается красно-оранжевой.

Текущее количество обычных `WALL` меньше требуемого.

### Constraint complete

Цифра отображается серой.

Текущее количество обычных `WALL` точно равно clue.

### Constraint exceeded

Цифра снова отображается красно-оранжевой.

WALL-клетки в переполненной строке или столбце подсвечиваются красным.

Feedback основан только на публичных правилах.

Он не сравнивает действия игрока с hidden `solution`.

---

## Dungeon rules

Актуальные базовые правила зафиксированы в `PROJECT.md`.

Реализованы:

- точное количество обычных WALL в каждой строке;
- точное количество обычных WALL в каждом столбце;
- все OPEN cells образуют одну ортогонально связанную область;
- каждый Monster находится в hallway dead end;
- каждый hallway dead end содержит Monster;
- hallways имеют ширину одну клетку;
- вне Treasure Rooms не существует открытых 2×2;
- Treasure Room имеет размер 3×3;
- Treasure Room содержит ровно один Chest;
- Treasure Room имеет ровно один entrance;
- Treasure Room является исключением из hallway 2×2 rule;
- Fixed Blocker является CLOSED и не считается обычной стеной;
- Directional Door является OPEN и задаёт дополнительное ограничение на соседние клетки.

Loops hallway не запрещены сами по себе, если одновременно соблюдаются:

- connectivity;
- dead-end rules;
- отсутствие запрещённых open 2×2.

---

## Level validation

Реализован:

`src/puzzle/LevelValidator.ts`

Валидатор не использует hidden `solution` для определения победы.

Hidden solution используется только как dev-данные для тестовых уровней и sanity fixtures.

Победа определяется исключительно публичными dungeon rules.

Проверяются:

- row clue counts;
- column clue counts;
- treasure-room candidates вокруг chest;
- 3×3 OPEN Treasure Room;
- ровно один chest в Treasure Room;
- ровно один entrance;
- отсутствие Monster внутри Treasure Room;
- отсутствие Directional Door внутри Treasure Room;
- совместимость нескольких Treasure Rooms;
- connectivity всех OPEN cells;
- monster dead-end rule;
- правило "каждый hallway dead end содержит monster";
- отсутствие open 2×2 вне Treasure Rooms;
- Fixed Blocker как CLOSED topology;
- Directional Door orientation;
- framing WALL вокруг Directional Door;
- запрет blocker вместо framing WALL;
- запрет Directional Door на краю поля.

`UNKNOWN` и `FLOOR` считаются OPEN.

Fixed Blocker считается CLOSED.

Monster, Chest и Directional Door считаются OPEN.

---

## Directional Door validation

Для horizontal door validator требует:

- left = OPEN;
- right = OPEN;
- up = ordinary `WALL`;
- down = ordinary `WALL`.

Для vertical door:

- up = OPEN;
- down = OPEN;
- left = ordinary `WALL`;
- right = ordinary `WALL`.

`Blocker` не удовлетворяет требованию ordinary `WALL`.

Результат validator содержит:

`doorsValid`

`isSolved` требует `doorsValid === true`.

---

## Validator sanity checks

Добавлены локальные dev-only sanity checks:

`src/dev/validatorSanity.ts`

Набор проверок покрывает:

- корректный `level001`;
- корректный `level002`;
- корректный `level003`;
- корректный `level004`;
- hidden solutions всех зарегистрированных `level001–level012`;
- authored Chest placement для diversity-batch `level005–level012`;
- query level selection;
- fixed blocker / door metadata;
- запрет overlap fixed objects;
- disconnected open-space при корректных clues;
- Monster вне dead end;
- открытый 2×2 вне Treasure Room;
- Treasure Room с двумя entrances;
- Blocker как CLOSED topology;
- валидную horizontal Door;
- запрет Blocker вместо framing WALL;
- неправильную открытую/закрытую сторону horizontal Door;
- Door на внешнем краю;
- Door внутри Treasure Room.

Sanity checks автоматически запускаются локально через:

`npm run dev`

Если хотя бы одна проверка падает, запуск локальной игры останавливается с ошибкой в console.

---

## Win state

`LevelValidator` подключён к игровому циклу.

После каждого фактического изменения доски проверяется puzzle state.

Когда одновременно выполнены все правила:

- уровень определяется как solved;
- дальнейшее редактирование доски блокируется;
- drag прекращается;
- появляется текст:

`Dungeon complete!`

Runtime victory никогда не сравнивает текущее поле с `level.solution`.

Это пока минимальный технический win state.

---

## Solver v1 + Treasure Room pruning

Реализован pure TypeScript solver:

`src/puzzle/solver/`

Публичные API:

- `solveLevel(level: LevelDefinition): SolveResult`;
- `solveLevelWithDiagnostics(level)` — тот же solver result плюс deterministic search counters.

Результат:

- `solutionCount: 0 | 1 | 2`;
- `0` означает, что решений нет;
- `1` означает ровно одно решение;
- `2` означает `2+`, после второго решения поиск прекращается;
- `firstSolution` хранит первое принятое WALL / OPEN решение;
- при отсутствии решений `firstSolution === null`.

Solver:

- начинает поиск только из `LevelDefinition`, а не из текущего состояния игрока;
- не зависит от Phaser, `GameScene` или UI;
- не использует hidden `level.solution` как oracle;
- считает Monster, Chest и Directional Door fixed OPEN;
- считает Fixed Blocker отдельной CLOSED metadata-клеткой, а не обычным `WALL`;
- выполняет fixed-point propagation по row / column clues;
- выполняет Directional Door propagation;
- выполняет Treasure Room propagation;
- отсекает невозможные row / column counts;
- консервативно отсекает branches, где обязательные OPEN regions уже невозможно соединить;
- использует entrance-aware Treasure Room candidate viability;
- если у Chest остаётся единственный viable 3×3 room candidate, форсит его interior в OPEN;
- если у выбранной комнаты подтверждён один entrance, форсит остальные mutable boundary cells в WALL;
- если остаётся единственный возможный entrance, форсит его в OPEN;
- Blocker на boundary считается CLOSED и остаётся `null`;
- Directional Door на boundary считается fixed OPEN entrance;
- использует deterministic most-constrained-first DFS;
- при branching проверяет `WALL`, затем `OPEN`;
- перед принятием каждого полного candidate передаёт его существующему `LevelValidator`.

Treasure Room partial viability и branch pressure используют один источник истины в `SearchState`.

Все зарегистрированные `level001`–`level012` зафиксированы solver sanity checks как уровни с ровно одним WALL / OPEN решением по текущему набору правил.

Solver diagnostics:

- `nodesVisited`;
- `branches`;
- `propagationPasses`;
- `maxDepth`;
- `completeCandidatesChecked`.

Локальные regression checks:

- `src/dev/solverSanity.ts`;
- `src/dev/treasureRoomPruningSanity.ts`.

Treasure Room pruning sanity покрывает:

- два подтверждённых entrance делают candidate невозможным;
- singleton room форсит interior OPEN;
- room propagation входит в общий fixed point;
- подтверждённый entrance закрывает остальной boundary;
- последний возможный entrance форсится OPEN;
- Blocker закрывает boundary без превращения в WALL;
- Door снаружи комнаты считается OPEN entrance.

Solver v1 пока не предоставляет:

- player hints;
- logical explanation steps;
- difficulty scoring;
- решение из текущего partial `PuzzleState` игрока.
---

## Level quality analyzer

Реализован отдельный authored-content analyzer:

`src/puzzle/quality/LevelQualityAnalyzer.ts`

Он не участвует в runtime victory и не добавляет новые dungeon rules. Его задача — отбраковывать технически валидные и уникальные, но геометрически слабые уровни до ручного playtest.

Текущий hard quality gate для `level005+`:

- wall density не выше 55%;
- ни одной полностью WALL строки или колонки;
- ни одного сплошного WALL-блока 3×3;
- не больше 25% всех клеток могут становиться WALL только через стартовую row/column clue propagation.

Near-full линии (`size - 1`) измеряются отдельно, но сами по себе пока не являются причиной reject.

Soft geometry warnings:

- `thickWallCellRatio > 60%`;
- `wallOpenBoundaryPerWall < 1.30`;
- `largestWallComponentRatio > 75%`.

Soft warning не меняет `report.passes` и не является dungeon rule.

Analyzer различает:

- `clueOnlyForcedWallCount`;
- `objectAwareForcedWallCount`;
- `objectAssistedForcedWallCount`.

Generator v1.1 также использует basic propagation exposure metrics:

- `basicPropagationResolvedWallCount`;
- `basicPropagationResolvedNonWallCount`;
- `basicPropagationResolvedCount`;
- `basicPropagationResolvedRatio`.

Для basic propagation fixed Monster / Chest / Door / Blocker считаются известными non-WALL для row/column clue accounting. Blocker при этом остаётся CLOSED topology object и не превращается в обычный clue-counting WALL.

Если `basicPropagationResolvedRatio > 70%`, analyzer выдаёт soft warning `basic propagation`. Ровно `70%` warning не даёт.

В generator pipeline любой текущий quality warning приводит к `geometry-warning` rejection, хотя сам warning остаётся content-quality сигналом, а не runtime rule.

Локальные regression checks:

`src/dev/levelQualitySanity.ts`

Они покрывают hard-quality failures, object-assisted deduction, soft geometry warnings, basic-propagation exposure и authored diversity-batch.
---

## Generator v1.1

Реализован постоянный dev-only solution-first generator базовых Monster / Chest puzzles:

`src/puzzle/generator/`

Поддерживаются пять archetypes:

- Monster-only;
- Chest-only с одной Treasure Room;
- Chest-only с двумя Treasure Rooms;
- Monsters + одна Treasure Room;
- Monsters + две Treasure Rooms.

Размеры:

- Monster-only, Chest-one-room и Mixed-one-room: 6×6 / 7×7 / 8×8;
- two-room archetypes: 7×7 / 8×8.

Каждый candidate строится из полной WALL / OPEN geometry, после чего row / column clues автоматически выводятся из solution. Randomness полностью seeded и deterministic: master seed задаёт воспроизводимую последовательность candidate seeds и layouts.

Acceptance pipeline:

1. `LevelValidator` подтверждает canonical dungeon rules;
2. `PuzzleSolver` требует ровно одно решение;
3. `LevelQualityAnalyzer` отбраковывает hard-quality failures;
4. любой текущий quality warning переводит candidate в `geometry-warning`;
5. exact playable duplicate внутри accepted pool текущего archetype получает `duplicate`.

Если solution-first candidate прошёл `LevelValidator`, но solver вернул `solutionCount === 0`, это считается внутренним invariant error, а не обычным rejection.

Playable duplicate signature включает:

- size;
- row clues;
- column clues;
- sorted Monster / Chest / Blocker / Door metadata;
- solution WALL / OPEN layout.

Seed, generated id и generator room metadata в signature не входят.

Важно: текущий dedupe set создаётся отдельно для каждого archetype. Cross-archetype global dedupe пока не гарантируется.

Generator v1.1 не поддерживает Blocker и Directional Door в generated geometry:

```ts
blockers: []
doors: []
```

Default pool:

- 10 accepted candidates на archetype;
- 50 accepted candidates всего;
- attempt limit 5000 на archetype.

Shortlist выбирается отдельно внутри каждого archetype:

- 3 candidates на archetype;
- 15 candidates всего;
- ranking учитывает bounded quality score и diversity / novelty.

CLI:

`npm run generate:candidates -- --seed <uint32>`

Для master seed `123456` полный run после Generator v1.1 и Treasure Room solver pruning стабильно заполняет 50 accepted candidates и 15 shortlisted candidates.

Выходные dev-artifacts:

- `.generated/candidates-<seed>.json`;
- `.generated/shortlist-<seed>.md`.

`.generated/` игнорируется git.

Generated candidates никогда автоматически не регистрируются в `src/data/levels/` и не становятся production-уровнями без ручного review / promotion.

Regression checks:

`src/dev/generatorSanity.ts`

Команда:

`npm run sanity:generator`

Difficulty scoring / logical difficulty estimation пока не реализованы.
---

## Generator / solver profiling

Реализован dev-only profiler:

- `src/dev/profileGenerator.ts`;
- `src/dev/profileGeneratorCli.ts`;
- `src/dev/profilerSanity.ts`;
- `src/dev/benchmarkTreasureRoomPruning.ts`.

Команда полного профиля:

`npm run profile:generator -- --seed <uint32>`

Profiler измеряет для каждого generation attempt:

- generation time;
- validation time;
- solver time;
- quality time;
- total time;
- solver diagnostics.

Для master seed `123456` до Treasure Room pruning основной bottleneck находился в `chest-one-room`: solver time был около `260209.68 ms`, а полный профиль по сумме archetypes — около `284789 ms`.

После entrance-aware Treasure Room propagation тот же seed показывает:

- `monster-only`: 44 attempts / 10 accepted, solver около `80 ms`;
- `chest-one-room`: 279 attempts / 10 accepted, solver около `1543 ms`;
- `chest-two-rooms`: 380 attempts / 10 accepted, solver около `105 ms`;
- `mixed-one-room`: 72 attempts / 10 accepted, solver около `29 ms`;
- `mixed-two-rooms`: 791 attempts / 10 accepted, solver около `63 ms`.

Суммарный archetype wall time полного profile run — около `2.74 s`, то есть примерно в `104×` меньше прежнего baseline.

Два основных pathological accepted `chest-one-room` seeds:

- `2567285821`: `4,573,081 -> 2,499` visited nodes;
- `421722065`: `3,755,181 -> 2,221` visited nodes.

Performance assertions не завязаны на wall-clock milliseconds: deterministic node counters считаются основным evidence, timing — supporting evidence.

После этого profiling больше не показывает solver как блокирующую проблему для текущего 6×6 / 7×7 / 8×8 generator workflow.


## Restart

Реализован ручной Restart текущего уровня.

Кнопка `Restart` полностью перезапускает `GameScene`.

При этом:

- создаётся новый `PuzzleState`;
- очищаются поставленные `WALL`;
- очищаются `FLOOR` marks;
- восстанавливаются fixed gameplay objects;
- clues возвращаются в начальное состояние;
- снимается solved state;
- input снова становится доступен;
- status text возвращается к обычной подсказке управления.

Query parameter уровня сохраняется, поэтому Restart перезапускает текущий dev level.

Отдельная history-система для Restart не используется.

---

# Not Implemented

## Core UX

Не реализованы:

- Undo;
- touch controls;
- keyboard shortcuts;
- полноценная win screen;
- переход на следующий уровень;
- campaign level selection;
- tutorial UI.

Undo не входит в текущий vertical slice и должен возвращаться только если playtests покажут реальную необходимость.

---

## Visuals

Не реализованы:

- ORYX dungeon tiles;
- ORYX walls;
- ORYX monsters;
- ORYX chest;
- ORYX blocker variants;
- ORYX doors;
- финальный visual language поля;
- dungeon floor rendering;
- wall adjacency / autotiling;
- polished clue graphics;
- animations;
- sound;
- effects.

Текущие `M`, `C`, `X`, `↔`, `↕` являются только техническими placeholder markers.

---

## Additional puzzle mechanics

Пока не реализованы:

- keys;
- locked doors;
- switches;
- changing doors;
- moving blockers;
- interactive dungeon objects;
- crypt / sarcophagus special rooms;
- дополнительные типы room;
- отдельная логика lava / water;
- edge doors / dungeon exits.

Эти системы не входят в Static Field Mechanics v1.

---

## Level production

Реализован dev-only Generator v1.1 candidate factory + shortlist pipeline, solver diagnostics и profiling pipeline.

Пока не реализованы:

- полноценный набор production-уровней;
- tutorial progression;
- автоматическая регистрация / promotion generated candidates в `src/data/levels/`;
- production campaign generation;
- difficulty estimation;
- global cross-archetype duplicate rejection.

Validator, optimized Solver v1, Level Quality Analyzer и Generator v1.1 образуют быстрый технический pipeline для поиска и отбора candidate levels, но финальный выбор shipping levels всё ещё требует ручного review и playtest.
---

## Product systems

Не реализованы:

- campaign / level map;
- save progress;
- daily puzzles;
- achievements;
- Yandex Games SDK;
- leaderboards;
- monetization;
- retention systems.

---

# Current Vertical Slice

Сейчас прототип позволяет:

1. загрузить один из двенадцати dev-уровней 6×6 / 7×7 / 8×8;
2. видеть row и column clues;
3. видеть Monster, Chest, Fixed Blocker и Directional Door;
4. ставить стены ЛКМ;
5. отмечать свободные клетки ПКМ;
6. рисовать и стирать drag-жестом;
7. видеть выполнение row/column constraints;
8. видеть overflow стен;
9. решать puzzle по полному текущему набору dungeon rules;
10. использовать уровни без Treasure Room;
11. использовать Fixed Blocker как отдельный CLOSED gameplay object;
12. использовать Directional Door как дополнительное дедуктивное ограничение;
13. получить минимальное состояние победы;
14. перезапустить текущий уровень через Restart;
15. dev-инструментом проверить уровень на `0 / 1 / 2+` решений и получить `firstSolution`;
16. dev-инструментом получать deterministic solver diagnostics;
17. dev-инструментом детерминированно генерировать accepted Monster / Chest candidate pool и diversity-aware shortlist;
18. dev-инструментом профилировать generator pipeline и focused pathological solver seeds.

Static Field Mechanics v1, optimized Solver v1, Level Quality Analyzer и Generator v1.1 функционально добавлены в dev/puzzle pipeline.
---

# Next Steps

Ближайший порядок разработки:

1. Перейти от performance work обратно к content quality: текущий full profile уже быстрый, поэтому не добавлять новые solver optimizations без нового измеренного bottleneck.

2. Ручно просмотреть `.generated/shortlist-123456.md` и candidate pool после v1.1, зафиксировать конкретные повторяющиеся проблемы generator content:
   - Chest-one-room может выглядеть слишком template-like;
   - Monster-only может давать слишком много Monster;
   - two-room shortlist может недостаточно разнообразить размеры.

3. После конкретного review отдельно спроектировать Generator v1.2 content-quality slice. Не смешивать его с solver optimization.

4. Исправить latent dedupe mismatch отдельным маленьким bug slice: текущий duplicate set работает per-archetype, а global cross-archetype dedupe пока не гарантируется.

5. Удачные generated layouts переносить в `src/data/levels/` только после ручного review / playtest и затем снова прогонять validator / solver / quality sanity.

6. Отдельно проектировать difficulty estimation / logical solver только если станет нужен контроль progression, hints или автоматическая оценка сложности.

7. ORYX visual pass делать поверх стабильной puzzle logic, не смешивая визуальную работу с изменением правил.

8. Progression, daily, monetization и другие meta-системы не добавлять раньше работающего набора качественных puzzle levels.
