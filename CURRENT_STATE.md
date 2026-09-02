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

Батч не является финальной progression-кривой и используется для проверки разнообразия базовых правил перед будущим generator.

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

## Solver v1

Реализован pure TypeScript solver:

`src/puzzle/solver/`

Публичный API:

`solveLevel(level: LevelDefinition): SolveResult`

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
- выполняет propagation по row / column clues;
- выполняет propagation Directional Door constraints;
- отсекает невозможные row / column counts;
- консервативно отсекает branches, где обязательные OPEN regions уже невозможно соединить;
- отсекает Treasure Room branches, если для Chest не осталось ни одного допустимого 3×3 candidate;
- использует deterministic most-constrained-first DFS;
- при branching проверяет `WALL`, затем `OPEN`;
- перед принятием каждого полного candidate передаёт его существующему `LevelValidator`.

Все зарегистрированные `level001`–`level012` зафиксированы solver sanity checks как уровни с ровно одним WALL / OPEN решением по текущему набору правил.

Solver v1 пока не предоставляет:

- player hints;
- logical explanation steps;
- difficulty scoring;
- generator;
- решение из текущего partial `PuzzleState` игрока.

Локальные regression checks находятся в:

`src/dev/solverSanity.ts`

Они запускаются через `npm run dev` после validator sanity checks.

---

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

Пока не реализованы:

- полноценный набор production-уровней;
- tutorial progression;
- автоматический generator;
- difficulty estimation;
- batch level-production pipeline.

Solver и проверка `0 / 1 / 2+` решений уже реализованы и могут использоваться как acceptance check для будущих уровней.

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
15. dev-инструментом проверить уровень на `0 / 1 / 2+` решений и получить `firstSolution`.

Static Field Mechanics v1 и Solver v1 функционально добавлены в puzzle-core.

---

# Next Steps

Ближайший порядок разработки:

1. Ручно пройти и сравнить `level005–level012`, отметить удачные Monster-only, Chest-only и mixed layouts и продолжать добавлять representative puzzle layouts только через Solver v1 uniqueness gate.

2. На реальных уровнях профилировать solver, особенно при росте поля к 10×10; целевой бюджет — около 1 секунды для обычного уровня, без жёсткого timing assertion.

3. Исправлять validator / solver edge cases только по конкретным найденным контрпримерам.

4. После достаточного набора проверенных уровней проектировать generator, используя solver как uniqueness gate.

5. Отдельно продумать difficulty estimation / logical solver, если станет нужен контроль сложности или hints.

6. ORYX visual pass делать поверх стабильной puzzle logic, не смешивая визуальную работу с изменением правил.

7. Progression, daily, monetization и другие meta-системы не добавлять раньше работающего набора качественных puzzle levels.

