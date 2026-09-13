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
}

export interface HelpUtility {
  readonly id: HelpUtilityId;
  readonly title: string;
  readonly body: string;
}

const RU_HELP_RULES: readonly HelpRule[] = [
  {
    id: 'goal',
    title: 'ЦЕЛЬ',
    body: 'Расставь стены так, чтобы одновременно выполнялись все правила. Вне обучения отмечать ПОЛ для победы не обязательно.',
  },
  {
    id: 'clues',
    title: 'ЧИСЛА ПО КРАЯМ',
    body: 'Число слева — точное количество стен в строке. Число сверху — точное количество стен в столбце.',
  },
  {
    id: 'floor',
    title: 'СТЕНЫ И ПОЛ',
    body: 'ПОЛ — вспомогательная пометка «здесь нет стены». При проверке решения обычные клетки без стен считаются открытыми даже без пометки. Клетки с монстрами и сундуками всегда открыты: стену на них поставить нельзя.',
  },
  {
    id: 'treasure-room',
    title: 'КОМНАТЫ И СУНДУК',
    body: 'Каждый сундук находится в комнате — квадрате ровно 3×3 без стен и монстров. В комнате ровно один сундук; он может стоять в любой из девяти клеток. У комнаты ровно один вход: один проход через её границу по стороне клетки. Комнаты не перекрываются.',
  },
  {
    id: 'monsters',
    title: 'МОНСТРЫ',
    body: 'У каждого монстра ровно один открытый сосед по стороне клетки — это тупик. Диагональные соседи не считаются. И наоборот: любой тупик коридора должен содержать монстра.',
  },
  {
    id: 'connectivity',
    title: 'СВЯЗНОСТЬ',
    body: 'Все открытые клетки, включая комнаты, сундуки и монстров, должны соединяться в одну область. Путь проходит только через общие стороны клеток; диагональ не считается.',
  },
  {
    id: 'open-2x2',
    title: 'КОРИДОРЫ',
    body: 'Вне комнаты с сундуком нельзя оставлять квадрат 2×2 без стен. Такой квадрат разрешён, только если все четыре клетки находятся внутри одной комнаты 3×3.',
  },
  {
    id: 'completion',
    title: 'ЗАВЕРШЕНИЕ',
    body: 'Уровень завершится автоматически, когда выполнены все правила. Одного совпадения чисел недостаточно: комнаты, монстры и проходы тоже должны быть устроены правильно. Вне обучения отмечать весь оставшийся ПОЛ не нужно.',
  },
] as const;

const EN_HELP_RULES: readonly HelpRule[] = [
  {
    id: 'goal',
    title: 'GOAL',
    body: 'Place walls so every dungeon rule is satisfied at the same time. Outside the tutorial, marking FLOOR is not required to win.',
  },
  {
    id: 'clues',
    title: 'EDGE NUMBERS',
    body: 'The number on the left is the exact number of walls in that row. The number above is the exact number of walls in that column.',
  },
  {
    id: 'floor',
    title: 'WALLS AND FLOOR',
    body: 'FLOOR is a solving mark meaning “no wall here”. When checking the solution, ordinary cells without walls count as open even without a mark. Monster and Chest cells are always open: you cannot place walls on them.',
  },
  {
    id: 'treasure-room',
    title: 'ROOMS AND CHESTS',
    body: 'Every Chest belongs to a room: an exact 3×3 square with no walls or Monsters. Each room has exactly one Chest, which can occupy any of its nine cells. A room has exactly one entrance: one passage across its boundary through a shared cell side. Rooms cannot overlap.',
  },
  {
    id: 'monsters',
    title: 'MONSTERS',
    body: 'Every Monster has exactly one open neighbour sharing a side — a dead end. Diagonal neighbours do not count. Conversely, every corridor dead end must contain a Monster.',
  },
  {
    id: 'connectivity',
    title: 'CONNECTIVITY',
    body: 'All open cells, including rooms, Chests and Monsters, must form one connected area. Paths connect through shared cell sides; diagonal contact does not count.',
  },
  {
    id: 'open-2x2',
    title: 'CORRIDORS',
    body: 'Outside a Chest room, a 2×2 square without walls is forbidden. Such a square is allowed only when all four cells lie inside the same 3×3 room.',
  },
  {
    id: 'completion',
    title: 'COMPLETION',
    body: 'The level completes automatically when every rule is satisfied. Matching the numbers alone is not enough: rooms, Monsters and passages must also obey their rules. Outside the tutorial, you do not need to mark all remaining FLOOR cells.',
  },
] as const;

const RU_HELP_UTILITIES: readonly HelpUtility[] = [
  {
    id: 'controls',
    title: 'ДЕЙСТВИЯ',
    body: 'ПК: ЛКМ — СТЕНА, ПКМ — ПОЛ; можно удерживать кнопку и вести по клеткам. На телефоне выбери СТЕНА или ПОЛ, затем нажимай или веди пальцем. Повторное нажатие тем же инструментом убирает стену или пометку.\nОТМЕНА отменяет последний жест. СБРОС убирает поставленные стены и пометки. ПОДСКАЗКА показывает, что должно быть в одной клетке: СТЕНА или ПОЛ.',
  },
  {
    id: 'feedback',
    title: 'ЦВЕТА НА ПОЛЕ',
    body: 'Красное число: стен в строке или столбце пока меньше или больше, чем нужно. Серое число: количество совпало.\nКрасные стены: в их строке или столбце стен слишком много. Подсвечиваются все стены этой линии, а не конкретная неверная клетка.\nКрасный ромб — обычная пометка ПОЛ, не ошибка. Цвета не проверяют остальные правила и не сравнивают каждый ход со скрытым решением.',
  },
] as const;

const EN_HELP_UTILITIES: readonly HelpUtility[] = [
  {
    id: 'controls',
    title: 'ACTIONS',
    body: 'Desktop: LMB — WALL, RMB — FLOOR; hold and drag across cells. On touch, choose WALL or FLOOR, then tap or drag. Clicking or tapping again with the same tool removes the wall or mark.\nUNDO reverts the last gesture. RESET removes placed walls and marks. HINT shows whether one cell should be WALL or FLOOR.',
  },
  {
    id: 'feedback',
    title: 'BOARD COLOURS',
    body: 'Red number: its row or column has fewer or more walls than required. Grey number: the count matches.\nRed walls: their row or column has too many walls. Every wall in that line is highlighted, not a specific incorrect cell.\nA red diamond is a normal FLOOR mark, not an error. Colours do not check the other rules or compare each move with the hidden solution.',
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
