import type { SupportedLanguage } from '../i18n/Language';
import {
  CellState,
  type CellState as CellStateValue,
  type GridPosition,
} from '../puzzle/types';

export type OnboardingTarget =
  | 'board-cells'
  | 'message';

interface BaseOnboardingStep {
  readonly target: OnboardingTarget;
  readonly message: string;
}

export interface BoardCellsOnboardingStep extends BaseOnboardingStep {
  readonly target: 'board-cells';
  readonly cells: readonly GridPosition[];
  readonly expectedState: CellStateValue;
  readonly guideClue?: {
    readonly axis: 'row' | 'column';
    readonly index: number;
  };
  /** Extra cells to highlight without making them editable tutorial targets. */
  readonly focusCells?: readonly GridPosition[];
}

export interface MessageOnboardingStep extends BaseOnboardingStep {
  readonly target: 'message';
  readonly autoAdvanceMs: number;
  /** Non-blocking reminders keep the board and controls usable while visible. */
  readonly allowInput?: boolean;
}

export type OnboardingStep =
  | BoardCellsOnboardingStep
  | MessageOnboardingStep;

const FLOWS: Readonly<Record<string, readonly OnboardingStep[]>> = {
  'campaign-001': [
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 5, y: 0 },
      ],
      focusCells: [{ x: 2, y: 0 }],
      message: 'Цифра 5 означает пять стен в этой строке. Монстр уже занимает шестую клетку, поэтому остальные пять — стены. Поставь все пять.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 5 },
      cells: [
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
      ],
      focusCells: [{ x: 0, y: 5 }],
      message: 'Цифра 0 означает: стен в строке нет. Монстр слева уже считается открытой клеткой. Отметь остальные пять клеток как пол.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 0, y: 4 }],
      focusCells: [{ x: 0, y: 5 }, { x: 1, y: 5 }],
      message: 'Теперь правило монстров. Монстр всегда находится в тупике: рядом по вертикали и горизонтали у него должен быть ровно один пол. Справа уже пол, значит сверху нужна стена.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 0 },
      cells: [
        { x: 0, y: 1 },
        { x: 0, y: 2 },
      ],
      focusCells: [{ x: 0, y: 0 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }],
      message: 'Смотри на столбец 4. Два монстра — это пол, а две стены уже известны. Чтобы получить четыре стены, две оставшиеся клетки должны стать стенами.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 3 }],
      focusCells: [{ x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 4 }],
      message: 'У этого монстра сверху и снизу уже стены, а слева край поля. Чтобы он был тупиком с ровно одним выходом, справа обязательно должен быть пол.',
    },
    {
      target: 'message',
      allowInput: true,
      autoAdvanceMs: 6500,
      message: 'Теперь продолжай сам: совмещай числа строк и столбцов с правилом монстров. И наоборот — любой тупик в коридоре обязан содержать монстра. Все открытые клетки в итоге должны оставаться связаны по сторонам.',
    },
  ],
  'campaign-002': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [
        { x: 4, y: 1 },
        { x: 5, y: 1 },
        { x: 6, y: 1 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
      ],
      focusCells: [{ x: 6, y: 2 }],
      message: 'Сундук всегда находится внутри полностью открытой комнаты ровно 3×3. Здесь положение комнаты уже определяется краем поля. Отметь остальные восемь клеток комнаты как пол.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [
        { x: 4, y: 0 },
        { x: 5, y: 0 },
        { x: 6, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 6, y: 4 },
      ],
      focusCells: [{ x: 6, y: 2 }],
      message: 'У комнаты ровно один вход. Значит вся её доступная граница, кроме единственного прохода, должна быть стеной. Закрой подсвеченные клетки.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 5, y: 4 }],
      focusCells: [{ x: 6, y: 2 }],
      message: 'Остался единственный вход в комнату. Отметь его как пол.',
    },
    {
      target: 'message',
      allowInput: true,
      autoAdvanceMs: 6500,
      message: 'Важное исключение: внутри комнаты 3×3 пустые квадраты 2×2 допустимы. Вне комнаты квадрат 2×2 не может состоять только из пола — хотя бы одна клетка должна быть стеной.',
    },
  ],
  'campaign-003': [
    {
      target: 'message',
      allowInput: true,
      autoAdvanceMs: 6000,
      message: 'Теперь первая самостоятельная задача с монстрами. Помни: весь пол должен образовать одну связанную область по сторонам, а квадрат 2×2 из одного пола вне комнат запрещён.',
    },
  ],
  'campaign-004': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 3 },
      cells: [
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 3, y: 5 },
      ],
      message: 'Теперь правила работают вместе. Начни с очевидного: в столбце с цифрой 0 стен нет. Отметь весь столбец как пол.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [
        { x: 2, y: 3 },
        { x: 4, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 5 },
        { x: 4, y: 5 },
      ],
      focusCells: [{ x: 4, y: 4 }],
      message: 'Сундук внизу задаёт комнату 3×3. Средний столбец комнаты ты уже открыл. Отметь оставшиеся подсвеченные клетки комнаты как пол.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [
        { x: 2, y: 2 },
        { x: 4, y: 2 },
        { x: 1, y: 3 },
        { x: 5, y: 3 },
        { x: 1, y: 4 },
        { x: 5, y: 4 },
        { x: 1, y: 5 },
        { x: 5, y: 5 },
      ],
      focusCells: [{ x: 4, y: 4 }, { x: 3, y: 2 }],
      message: 'У этой комнаты единственный вход — открытая клетка сверху по центру. Остальная граница комнаты должна быть стеной.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 5, y: 1 }],
      focusCells: [{ x: 5, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 3 }],
      message: 'Вот как правила взаимодействуют: стены комнаты закрыли монстру слева и снизу путь. Чтобы монстр остался тупиком с одним выходом, клетка сверху должна быть полом.',
    },
    {
      target: 'message',
      allowInput: true,
      autoAdvanceMs: 5200,
      message: 'Дальше решай самостоятельно: числа, комнаты и монстры могут заставлять друг друга. Ищи такие цепочки — это основа сложных уровней.',
    },
  ],
  'campaign-005': [
    {
      target: 'message',
      allowInput: true,
      autoAdvanceMs: 4500,
      message: 'Последняя обучающая задача — теперь без подсветок. Реши её самостоятельно. Если забудешь любое правило, справочник всегда доступен через ⓘ.',
    },
  ],
};

const EN_MESSAGES: Readonly<Record<string, readonly string[]>> = {
  'campaign-001': [
    'The number 5 means this row contains five walls. The Monster already occupies the sixth cell, so the other five cells are walls. Place all five.',
    'The number 0 means there are no walls in this row. The Monster on the left already counts as an open cell. Mark the other five cells as floor.',
    'Now use the Monster rule. A Monster is always at a dead end: exactly one orthogonal neighbor must be floor. The cell to its right is already floor, so the cell above must be a wall.',
    'Look at column 4. Two Monsters are floor and two walls are already known. To reach four walls, the two remaining cells must be walls.',
    'This Monster already has walls above and below, and the board edge is on its left. To leave exactly one exit, the cell on the right must be floor.',
    'Continue on your own: combine row and column numbers with the Monster rule. Conversely, every corridor dead end must contain a Monster. All open cells must remain connected by their sides.',
  ],
  'campaign-002': [
    'A Chest always belongs inside a fully open room exactly 3×3. Here the board edge already determines the room position. Mark the other eight room cells as floor.',
    'A treasure room has exactly one entrance. Every reachable border cell except that single passage must therefore be a wall. Close the highlighted cells.',
    'Only the single room entrance remains. Mark it as floor.',
    'Important exception: open 2×2 squares are allowed inside a 3×3 treasure room. Outside a room, an open 2×2 is forbidden — at least one cell must be a wall.',
  ],
  'campaign-003': [
    'This is your first independent Monster puzzle. Remember: all floor must form one connected area, and an all-floor 2×2 square is forbidden outside treasure rooms.',
  ],
  'campaign-004': [
    'Now the rules work together. Start with the obvious clue: a column marked 0 contains no walls. Mark the whole column as floor.',
    'The Chest near the bottom defines a 3×3 room. You already opened the middle column of that room. Mark the remaining highlighted room cells as floor.',
    'This room has one entrance: the open cell at the top center. The rest of the room border must be walls.',
    'Here the rules interact: the room walls blocked the Monster on the left and below. To keep the Monster at a dead end with one exit, the cell above must be floor.',
    'Continue independently: numbers, rooms and Monsters can force one another. Look for these chains — they are the basis of harder levels.',
  ],
  'campaign-005': [
    'The final tutorial puzzle has no highlights. Solve it on your own. If you forget a rule, the reference is always available through ⓘ.',
  ],
};

export function createOnboardingFlow(
  levelId: string,
  language: SupportedLanguage = 'ru',
): readonly OnboardingStep[] {
  const flow = FLOWS[levelId] ?? [];
  if (language === 'ru') return flow;
  const messages = EN_MESSAGES[levelId] ?? [];
  return flow.map((step, index) => ({
    ...step,
    message: messages[index] ?? step.message,
  }));
}

export function isOnboardingStepSatisfied(
  step: OnboardingStep,
  getCellState: (x: number, y: number) => CellStateValue,
): boolean {
  if (step.target !== 'board-cells') return false;
  return step.cells.every(
    ({ x, y }) => getCellState(x, y) === step.expectedState,
  );
}

export function shouldShowContextualOnboarding(
  levelId: string,
  completedLevelIds: readonly string[],
): boolean {
  return createOnboardingFlow(levelId).length > 0
    && !completedLevelIds.includes(levelId);
}
