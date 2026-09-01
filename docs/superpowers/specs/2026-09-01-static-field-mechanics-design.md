# Dungeon Logic — Static Field Mechanics v1

## Goal

Расширить базовую механику Dungeon Logic двумя статическими элементами:

- Fixed Blocker;
- Directional Door.

Они должны добавлять новые дедуктивные ограничения, не вводя изменение состояния поля, ключи, переключатели или другие динамические системы.

---

# 1. Основной принцип

Игрок по-прежнему выполняет только базовые действия:

- ставит скрытые стены;
- убирает поставленные стены;
- ставит вспомогательные FLOOR marks.

Новые объекты находятся на поле с начала уровня и не изменяют состояние во время решения.

---

# 2. Row / column clues

Row и column clues считают только обычные скрытые WALL-клетки, которые должен определить игрок.

Не входят в clues:

- Fixed Blocker;
- Directional Door;
- Monster;
- Chest;
- другие заранее известные fixed cells.

Пример:

Если clue строки равен `3`, игрок должен найти ровно три обычные стены независимо от количества заранее расположенных blockers.

---

# 3. Fixed Blocker

## Семантика

Fixed Blocker — заранее известная непроходимая клетка.

Визуально позднее может изображаться разными ORYX-объектами:

- камень;
- ящик;
- бочка;
- колонна;
- завал;
- пропасть;
- другой подходящий объект.

Для puzzle logic все эти варианты являются одним типом:

`BLOCKER`

## Правила

Blocker:

- находится на поле с начала уровня;
- не может быть изменён игроком;
- является CLOSED для всех топологических правил;
- не входит в row/column wall clues;
- не участвует в общей connected open area;
- разрывает открытые 2×2;
- не считается открытым соседом при определении dead ends.

Blocker не является обычным WALL.

Это важно, потому что обычная WALL является скрытым состоянием, которое должен определить игрок, а blocker известен заранее.

---

# 4. Directional Door

## Семантика

Directional Door — заранее известная открытая клетка с фиксированной ориентацией.

Поддерживаются:

- horizontal;
- vertical.

Door всегда является OPEN.

Игрок не может изменить её состояние.

---

# 5. Horizontal Door

Для horizontal door:

- клетка слева обязана быть OPEN;
- клетка справа обязана быть OPEN;
- клетка сверху обязана быть обычной WALL;
- клетка снизу обязана быть обычной WALL.

Схема:

```text
  #
. D .
  #
```

Где:

- `D` — horizontal door;
- `.` — обязательно OPEN;
- `X` — обязательно CLOSED.

CLOSED может быть:

- обычной WALL;
- Fixed Blocker.

---

# 6. Vertical Door

Для vertical door:

- клетка сверху обязана быть OPEN;
- клетка снизу обязана быть OPEN;
- клетка слева обязана быть обычной WALL;
- клетка справа обязана быть обычной WALL.

Схема:

```text
  .
X D X
  .
```

---

# 7. Door и остальные dungeon rules

Door считается обычным OPEN-пространством для:

- общей connectivity;
- подсчёта открытых соседей;
- monster / dead-end rule;
- проверки открытых 2×2.

Из-за directional rule корректная door имеет ровно два открытых ортогональных соседа, расположенных напротив друг друга.

Следовательно, сама door не может являться dead end.

Door не входит в wall clues.

---

# 8. Door и граница уровня

В первой версии Directional Door не может находиться на внешнем краю поля.

У неё всегда должны существовать все четыре ортогональных соседних клетки.

Edge entrances / dungeon exits через дверь пока не реализуются.

---

# 9. Door и Treasure Room

Directional Door не может находиться внутри 3×3 Treasure Room.

При этом door может находиться сразу за пределами Treasure Room и являться её единственным входом.

В таком случае:

- door остаётся OPEN;
- соединение door ↔ room считается entrance edge;
- directional rule двери должно одновременно выполняться.

---

# 10. Blocker и Treasure Room

Treasure Room обязана состоять из девяти OPEN-клеток.

Следовательно:

- blocker не может находиться внутри корректной Treasure Room;
- обычная WALL не может находиться внутри неё.

Это следует из существующего room rule и не требует отдельного специального исключения.

---

# 11. Взаимное наложение fixed objects

Одна клетка не может одновременно содержать несколько fixed gameplay objects.

Запрещены пересечения:

- blocker + door;
- blocker + monster;
- blocker + chest;
- door + monster;
- door + chest;
- monster + chest.

Некорректный LevelDefinition с такими пересечениями должен быть обнаружен при создании puzzle / dev validation, а не молча интерпретирован.

---

# 12. LevelDefinition

Формат уровня расширяется.

Добавляются:

```ts
blockers: readonly GridPosition[];

doors: readonly DoorDefinition[];
```

DoorDefinition:

```ts
interface DoorDefinition {
  position: GridPosition;

  orientation:
    | 'horizontal'
    | 'vertical';
}
```

Уровень может содержать:

- 0 blockers;
- 0 doors;
- 0 monsters;
- 0 chests.

Пустые массивы являются корректными.

---

# 13. CellState

Существующий mutable `CellState` не расширяется специальными объектами.

Он по-прежнему описывает пользовательское состояние обычной клетки:

- Unknown;
- Wall;
- Floor.

Blockers, doors, monsters и chests являются metadata уровня.

Это позволяет не смешивать:

- скрытые стены игрока;
- заранее известную структуру подземелья.

---

# 14. PuzzleState

PuzzleState должен предоставлять проверки:

```ts
isBlocker(x, y)
isDoor(x, y)
getDoor(x, y)
```

`isFixedCell()` должен считать fixed:

- monster;
- chest;
- blocker;
- door.

Игрок не может изменять такие клетки.

Initial mutable state:

- monster → Floor;
- chest → Floor;
- door → Floor;
- blocker → не требует пользовательского Wall-state.

Blocker определяется как CLOSED через metadata, а не через обычный `CellState.Wall`.

---

# 15. Validator semantics

Общая функция OPEN должна учитывать metadata.

Клетка CLOSED, если:

1. это Fixed Blocker;
2. либо её пользовательский state равен Wall.

Во всех остальных случаях клетка OPEN.

Таким образом:

- Unknown остаётся OPEN;
- Floor остаётся OPEN;
- Monster OPEN;
- Chest OPEN;
- Door OPEN;
- Blocker CLOSED;
- Wall CLOSED.

---

# 16. Door validation

В `ValidationResult` добавляется отдельный результат:

```ts
doorsValid: boolean;
```

Для каждой двери validator проверяет:

- дверь не находится на edge;
- orientation соответствует required OPEN neighbors;
- orientation соответствует required CLOSED neighbors.

`isSolved` требует:

```text
doorsValid === true
```

---

# 17. Existing rules

Новые элементы не отменяют существующие правила.

Для solved puzzle одновременно должны выполняться:

- row clues;
- column clues;
- connectivity;
- monster/dead-end rules;
- hallway width / 2×2 rule;
- Treasure Room rules, если есть chests;
- Directional Door rules.

Blocker влияет на эти проверки через CLOSED topology.

---

# 18. Levels without Treasure Rooms

`chests: []` является полноценным допустимым уровнем.

Если chests отсутствуют:

- Treasure Room не требуется;
- все OPEN-клетки являются hallway space;
- правило запрета OPEN 2×2 применяется ко всему открытому пространству.

Это важный тип будущих уровней.

---

# 19. First test level

После реализации mechanics должен появиться отдельный test level, который реально использует обе новые механики.

Цель уровня:

- минимум 2 monsters;
- 0 или 1 chest;
- минимум 1 blocker;
- минимум 1 horizontal или vertical door;
- решение должно требовать учитывать door orientation;
- blocker должен реально влиять на topology;
- уровень не должен быть простым отражением существующего level001.

Точный layout определяется после реализации validator support.

---

# 20. Out of scope

В эту версию не входят:

- keys;
- locked doors;
- switches;
- opening / closing doors;
- moving blockers;
- interactive objects;
- crypt rooms;
- новые room archetypes;
- lava / water как отдельные логические типы;
- edge doors;
- procedural generation.

Визуально вода, камни, ящики и другие объекты позже могут использоваться как разные представления одного `BLOCKER`.
