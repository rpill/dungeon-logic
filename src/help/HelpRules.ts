import type { SupportedLanguage } from '../i18n/Language';

export type HelpRuleId =
  | 'goal'
  | 'clues'
  | 'connectivity'
  | 'open-2x2'
  | 'monsters'
  | 'treasure-room'
  | 'controls'
  | 'feedback';

export interface HelpRule {
  readonly id: HelpRuleId;
  readonly title: string;
  readonly body: string;
  readonly diagram?: string;
}

const RU_HELP_RULES: readonly HelpRule[] = [
  {
    id: 'goal',
    title: 'ЦЕЛЬ',
    body: 'Расставь стены так, чтобы все правила подземелья выполнялись одновременно. Известный пол можно отмечать для удобства решения, но это не требуется для завершения уровня.',
  },
  {
    id: 'clues',
    title: 'ЧИСЛА СТРОК И СТОЛБЦОВ',
    body: 'Число слева показывает точное количество стен в строке. Число сверху — точное количество стен в столбце.',
    diagram: '    2\n  ┌─────┐\n2 │ ■ · ■ │\n  └─────┘',
  },
  {
    id: 'connectivity',
    title: 'ЕДИНОЕ ПОДЗЕМЕЛЬЕ',
    body: 'Все клетки, которые не являются стенами, должны образовывать одну общую область. Соединение считается только по сторонам: вверх, вниз, влево и вправо. Диагональ не соединяет клетки.',
  },
  {
    id: 'open-2x2',
    title: 'НЕТ ПУСТОГО 2×2 В КОРИДОРАХ',
    body: 'Вне комнаты с сундуком нельзя оставлять полностью открытый квадрат 2×2. В каждом таком блоке хотя бы одна клетка должна быть стеной. Комната 3×3 с сундуком — исключение из этого правила.',
    diagram: 'НЕЛЬЗЯ      МОЖНО\n· ·         · ■\n· ·         · ·',
  },
  {
    id: 'monsters',
    title: 'МОНСТРЫ И ТУПИКИ',
    body: 'Монстр всегда находится в тупике коридора: у его клетки ровно один ортогональный сосед, являющийся полом. И наоборот, любой тупик коридора должен содержать монстра. Внутренние клетки комнаты с сундуком тупиками коридора не считаются.',
    diagram: '■ ■ ■\n■ M ·\n■ ■ ■',
  },
  {
    id: 'treasure-room',
    title: 'КОМНАТА С СУНДУКОМ',
    body: 'Каждый сундук находится внутри полностью открытой комнаты ровно 3×3. У такой комнаты ровно один вход наружу и ровно один сундук. Монстров внутри комнаты быть не может. Положение комнаты нужно определить по остальным правилам.',
    diagram: '■ ■ · ■ ■\n■ · · · ■\n■ · C · ■\n■ · · · ■\n■ ■ ■ ■ ■',
  },
  {
    id: 'controls',
    title: 'УПРАВЛЕНИЕ',
    body: 'На компьютере: ЛКМ ставит стены, ПКМ отмечает известный пол для удобства; обе кнопки можно удерживать и вести по клеткам. На телефоне выбери СТЕНА или ПОЛ и нажимай/веди пальцем. ПОЛ — необязательная пометка и для завершения уровня не требуется. Отмена отменяет последний жест, Сброс очищает доску.',
  },
  {
    id: 'feedback',
    title: 'КРАСНАЯ ПОДСВЕТКА',
    body: 'Красноватая стена означает уже видимое нарушение: в её строке или столбце поставлено больше стен, чем разрешает число. Игра не сравнивает каждый ход со скрытым решением.',
  },
] as const;

const EN_HELP_RULES: readonly HelpRule[] = [
  {
    id: 'goal',
    title: 'GOAL',
    body: 'Place walls so all dungeon rules are satisfied at the same time. You may mark known floor cells as a solving aid, but floor marks are not required to finish a level.',
  },
  {
    id: 'clues',
    title: 'ROW AND COLUMN NUMBERS',
    body: 'The number on the left is the exact number of walls in that row. The number above is the exact number of walls in that column.',
    diagram: '    2\n  ┌─────┐\n2 │ ■ · ■ │\n  └─────┘',
  },
  {
    id: 'connectivity',
    title: 'ONE CONNECTED DUNGEON',
    body: 'Every cell that is not a wall must belong to one connected area. Cells connect only by their sides: up, down, left and right. Diagonals do not connect.',
  },
  {
    id: 'open-2x2',
    title: 'NO OPEN 2×2 IN CORRIDORS',
    body: 'Outside a treasure room, a fully open 2×2 square is forbidden. At least one cell in every such block must be a wall. A 3×3 treasure room is the exception.',
    diagram: 'NOT OK      OK\n· ·         · ■\n· ·         · ·',
  },
  {
    id: 'monsters',
    title: 'MONSTERS AND DEAD ENDS',
    body: 'A Monster always sits at a corridor dead end: its cell has exactly one orthogonal FLOOR neighbor. Conversely, every corridor dead end must contain a Monster. Cells inside a treasure room do not count as corridor dead ends.',
    diagram: '■ ■ ■\n■ M ·\n■ ■ ■',
  },
  {
    id: 'treasure-room',
    title: 'TREASURE ROOM',
    body: 'Every Chest belongs inside a fully open room exactly 3×3. That room has exactly one entrance and exactly one Chest. Monsters cannot be inside it. You must infer the room position from the other rules.',
    diagram: '■ ■ · ■ ■\n■ · · · ■\n■ · C · ■\n■ · · · ■\n■ ■ ■ ■ ■',
  },
  {
    id: 'controls',
    title: 'CONTROLS',
    body: 'Desktop: LMB places walls, RMB optionally marks known floor as a solving aid; you can hold either button and drag across cells. On touch devices, choose WALL or FLOOR and tap/drag. FLOOR is optional notation and is not required to finish a level. Undo reverts the last gesture, Reset clears the board.',
  },
  {
    id: 'feedback',
    title: 'RED HIGHLIGHT',
    body: 'A reddish wall marks a visible contradiction: its row or column already contains more walls than the clue allows. The game does not compare every move with the hidden solution.',
  },
] as const;

export const HELP_RULES: readonly HelpRule[] = RU_HELP_RULES;

export function getHelpRules(language: SupportedLanguage): readonly HelpRule[] {
  return language === 'ru' ? RU_HELP_RULES : EN_HELP_RULES;
}
