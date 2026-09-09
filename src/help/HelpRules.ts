import type { SupportedLanguage } from '../i18n/Language';

export type HelpRuleId =
  | 'goal'
  | 'clues'
  | 'floor'
  | 'treasure-room'
  | 'monsters'
  | 'connectivity'
  | 'open-2x2'
  | 'completion';

export type HelpUtilityId = 'controls' | 'feedback';

export interface HelpRule {
  readonly id: HelpRuleId;
  readonly title: string;
  readonly body: string;
  readonly diagram?: string;
}

export interface HelpUtility {
  readonly id: HelpUtilityId;
  readonly title: string;
  readonly body: string;
}

const RU_HELP_RULES: readonly HelpRule[] = [
  {
    id: 'goal',
    title: '1. ЦЕЛЬ',
    body: 'Расставь стены так, чтобы одновременно выполнялись все правила. ПОЛ можно отмечать для удобства, но для победы это не обязательно.',
  },
  {
    id: 'clues',
    title: '2. ЧИСЛА',
    body: 'Число слева — точное количество стен в строке. Число сверху — точное количество стен в столбце.',
    diagram: '    2\n  ┌─────┐\n2 │ ■ · ■ │\n  └─────┘',
  },
  {
    id: 'floor',
    title: '3. ПОЛ',
    body: 'Если клетка точно не является стеной, её можно отметить как ПОЛ. Это вспомогательная пометка — заполнять весь пол не требуется.',
  },
  {
    id: 'treasure-room',
    title: '4. КОМНАТЫ',
    body: 'Каждый сундук находится в открытой комнате ровно 3×3. У комнаты один сундук и ровно один вход. Монстров внутри быть не может.',
    diagram: '■ ■ · ■ ■\n■ · · · ■\n■ · C · ■\n■ · · · ■\n■ ■ ■ ■ ■',
  },
  {
    id: 'monsters',
    title: '5. МОНСТРЫ',
    body: 'У каждого монстра ровно один соседний проход. И наоборот: любой тупик коридора должен содержать монстра.',
    diagram: '■ ■ ■\n■ M ·\n■ ■ ■',
  },
  {
    id: 'connectivity',
    title: '6. СВЯЗНОСТЬ',
    body: 'Весь проход образует одну общую область. Клетки соединяются только сторонами; диагональ не считается.',
  },
  {
    id: 'open-2x2',
    title: '7. КОРИДОРЫ',
    body: 'Вне комнаты с сундуком открытого блока 2×2 быть не может.',
    diagram: 'НЕЛЬЗЯ      МОЖНО\n· ·         · ■\n· ·         · ·',
  },
  {
    id: 'completion',
    title: '8. ЗАВЕРШЕНИЕ',
    body: 'Поставь все стены правильно — уровень завершится автоматически. Отмечать весь оставшийся ПОЛ не нужно.',
  },
] as const;

const EN_HELP_RULES: readonly HelpRule[] = [
  {
    id: 'goal',
    title: '1. GOAL',
    body: 'Place walls so every dungeon rule is satisfied at the same time. FLOOR can be marked as a solving aid, but it is not required to win.',
  },
  {
    id: 'clues',
    title: '2. NUMBERS',
    body: 'The number on the left is the exact number of walls in that row. The number above is the exact number of walls in that column.',
    diagram: '    2\n  ┌─────┐\n2 │ ■ · ■ │\n  └─────┘',
  },
  {
    id: 'floor',
    title: '3. FLOOR',
    body: 'If a cell is definitely not a wall, you can mark it as FLOOR. This is optional solving notation; you do not need to mark every floor cell.',
  },
  {
    id: 'treasure-room',
    title: '4. ROOMS',
    body: 'Every Chest is inside an open room exactly 3×3. A room has one Chest and exactly one entrance. Monsters cannot be inside it.',
    diagram: '■ ■ · ■ ■\n■ · · · ■\n■ · C · ■\n■ · · · ■\n■ ■ ■ ■ ■',
  },
  {
    id: 'monsters',
    title: '5. MONSTERS',
    body: 'Every Monster has exactly one neighboring passage. Conversely, every corridor dead end must contain a Monster.',
    diagram: '■ ■ ■\n■ M ·\n■ ■ ■',
  },
  {
    id: 'connectivity',
    title: '6. CONNECTIVITY',
    body: 'All passages form one connected area. Cells connect only by their sides; diagonal contact does not connect them.',
  },
  {
    id: 'open-2x2',
    title: '7. CORRIDORS',
    body: 'Outside a room with a Chest, an open 2×2 block is forbidden.',
    diagram: 'NOT OK      OK\n· ·         · ■\n· ·         · ·',
  },
  {
    id: 'completion',
    title: '8. COMPLETION',
    body: 'Place every wall correctly and the level completes automatically. You do not need to mark all remaining FLOOR cells.',
  },
] as const;

const RU_HELP_UTILITIES: readonly HelpUtility[] = [
  {
    id: 'controls',
    title: 'ДЕЙСТВИЯ',
    body: 'ПК: ЛКМ — СТЕНА, ПКМ — ПОЛ; можно удерживать кнопку и вести по клеткам. На телефоне выбери СТЕНА или ПОЛ, затем нажимай или веди пальцем. ОТМЕНА отменяет последний жест, СБРОС очищает поле. ПОДСКАЗКА показывает одну логически правильную клетку.',
  },
  {
    id: 'feedback',
    title: 'КРАСНАЯ ПОДСВЕТКА',
    body: 'Красный цвет показывает уже видимое противоречие правил, например лишнюю стену в строке или столбце. Игра не сравнивает каждый ход со скрытым решением.',
  },
] as const;

const EN_HELP_UTILITIES: readonly HelpUtility[] = [
  {
    id: 'controls',
    title: 'ACTIONS',
    body: 'Desktop: LMB — WALL, RMB — FLOOR; hold and drag across cells. On touch, choose WALL or FLOOR, then tap or drag. UNDO reverts the last gesture, RESET clears the board. HINT reveals one logically correct cell.',
  },
  {
    id: 'feedback',
    title: 'RED HIGHLIGHT',
    body: 'Red marks a contradiction already visible from the rules, such as too many walls in a row or column. The game does not compare every move with the hidden solution.',
  },
] as const;

export const HELP_RULES: readonly HelpRule[] = RU_HELP_RULES;
export const HELP_UTILITIES: readonly HelpUtility[] = RU_HELP_UTILITIES;

export function getHelpRules(language: SupportedLanguage): readonly HelpRule[] {
  return language === 'ru' ? RU_HELP_RULES : EN_HELP_RULES;
}

export function getHelpUtilities(language: SupportedLanguage): readonly HelpUtility[] {
  return language === 'ru' ? RU_HELP_UTILITIES : EN_HELP_UTILITIES;
}
