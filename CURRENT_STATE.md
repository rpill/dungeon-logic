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
- browser context menu disabled for game input.

---

## Puzzle model

Реализован `PuzzleState`.

Состояния обычной клетки:

- `UNKNOWN`;
- `WALL`;
- `FLOOR`.

`FLOOR` является пользовательской вспомогательной отметкой.

Для логики решения `UNKNOWN` и `FLOOR` считаются открытым пространством, пока клетка не является `WALL`.

---

## Fixed cells

Поддерживаются фиксированные открытые клетки:

- monsters;
- chests.

Игрок не может:

- поставить на них стену;
- стереть их;
- изменить их состояние через обычный input.

В прототипе они временно отображаются буквами:

- `M` — monster;
- `C` — chest.

Позже они будут заменены игровыми спрайтами.

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
- hidden solution для разработки.

Текущий тестовый уровень:

`src/data/levels/level001.ts`

Размер:

6×6.

В нём есть:

- один monster;
- один chest;
- одна предполагаемая treasure room 3×3.

---

## Board rendering

Реализованы:

- `BoardView`;
- `CellView`;
- сетка 6×6;
- row clues;
- column clues;
- отображение WALL;
- отображение FLOOR mark;
- отображение fixed cells.

Визуальный стиль пока технический placeholder.

ORYX ещё не подключён к игровому полю.

---

## Mouse input

### Left Mouse Button

ЛКМ:

- ставит WALL;
- повторное применение к WALL стирает WALL.

Если мазок начинается не на WALL:

- drag рисует стены.

Если мазок начинается на WALL:

- drag стирает существующие стены;
- другие состояния во время стирающего мазка не меняются.

### Right Mouse Button

ПКМ:

- ставит FLOOR mark;
- повторное применение к FLOOR стирает FLOOR mark.

Если мазок начинается не на FLOOR:

- drag рисует FLOOR marks.

Если мазок начинается на FLOOR:

- drag стирает существующие FLOOR marks;
- другие состояния во время стирающего мазка не меняются.

### Drag behavior

В рамках одного drag-жеста:

- одна клетка обрабатывается максимум один раз;
- повторный проход курсора через неё не переключает состояние повторно.

---

## Row / column clue feedback

Clues обновляются в реальном времени.

Состояния:

### Constraint incomplete

Цифра отображается красно-оранжевой.

Это означает:

текущее количество WALL меньше требуемого.

### Constraint complete

Цифра отображается серой.

Это означает:

текущее количество WALL точно равно clue.

### Constraint exceeded

Цифра снова отображается красно-оранжевой.

WALL-клетки в переполненной строке или столбце подсвечиваются красным.

Этот feedback основан только на публичном правиле количества стен.

Он не сравнивает действия игрока со скрытым solution.

---

## Dungeon rules

Актуальные правила зафиксированы в `PROJECT.md` по tutorial screens оригинальной Dungeons & Diagrams.

Зафиксированы:

- точное количество стен в каждой строке;
- точное количество стен в каждом столбце;
- все не-стены образуют одну связанную область;
- ортогональная связность;
- каждый monster находится в hallway dead end;
- каждый hallway dead end содержит monster;
- hallways имеют ширину одну клетку;
- вне treasure rooms не существует открытых 2×2;
- treasure room имеет размер 3×3;
- treasure room содержит ровно один chest;
- treasure room имеет ровно один вход;
- treasure room является исключением из hallway 2×2 rule.

---

## Level validation

Реализован:

`src/puzzle/LevelValidator.ts`

Валидатор не использует hidden `solution` для определения победы.

Он проверяет публичные правила головоломки.

Реализованы проверки:

- row clue counts;
- column clue counts;
- treasure-room candidates вокруг chest;
- 3×3 open treasure room;
- ровно один chest в treasure room;
- ровно один entrance;
- отсутствие monsters внутри treasure room;
- совместимость нескольких treasure rooms;
- connectivity всех open cells;
- monster dead-end rule;
- правило "каждый hallway dead end содержит monster";
- отсутствие open 2×2 вне treasure rooms.

`UNKNOWN` и `FLOOR` считаются open cells.

Поэтому игроку не требуется вручную отмечать FLOOR во всех свободных клетках для завершения уровня.

---

## Win state

`LevelValidator` подключён к игровому циклу.

После каждого фактического изменения доски проверяется состояние puzzle.

Когда все правила одновременно выполнены:

- уровень определяется как solved;
- дальнейшее редактирование доски блокируется;
- drag прекращается;
- появляется текст:

`Dungeon complete!`

Это пока минимальный технический win state.

---

# Not Implemented

## Core UX

- Undo;
- Restart;
- touch controls;
- keyboard shortcuts;
- отдельная полноценная win screen;
- переход на следующий уровень;
- level selection.

---

## Visuals

- ORYX dungeon tiles;
- ORYX walls;
- ORYX monsters;
- ORYX chest;
- финальный visual language поля;
- dungeon floor rendering;
- wall adjacency/autotiling;
- polished clue graphics;
- animations;
- sound;
- effects.

---

## Puzzle systems

- несколько реальных уровней;
- tutorial progression;
- автоматический solver;
- проверка уникальности решения;
- автоматический generator;
- difficulty estimation.

---

## Product systems

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

Сейчас прототип уже позволяет:

1. загрузить один 6×6 уровень;
2. видеть clues, monster и chest;
3. ставить стены ЛКМ;
4. отмечать свободные клетки ПКМ;
5. рисовать и стирать drag-жестом;
6. видеть выполнение row/column constraints;
7. видеть overflow стены;
8. решить puzzle по полному набору dungeon rules;
9. получить минимальное состояние победы.

Главная текущая задача — довести puzzle-core до удобного playable состояния перед визуальным ORYX pass.

---

# Next Steps

Ближайший порядок разработки:

1. Undo.
2. Restart.
3. Проверить UX полного прохождения level001.
4. При необходимости исправить puzzle rules / validator edge cases.
5. Сделать ещё несколько вручную заданных уровней.
6. Начать минимальный ORYX visual pass.
7. После стабильного puzzle-core заняться progression и продуктовым циклом.

Не добавлять generator, daily, monetization или сложные meta-системы раньше работающего и приятного core loop.