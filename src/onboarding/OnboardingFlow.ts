import type { TutorialLevelId } from '../content/tutorial/types';
import type { SupportedLanguage } from '../i18n/Language';
import {
  CellState,
  type CellState as CellStateValue,
  type GridPosition,
} from '../puzzle/types';

export type OnboardingTarget = 'board-cells';

interface BaseOnboardingStep {
  readonly target: OnboardingTarget;
  readonly message: string;
}

export interface BoardCellsOnboardingStep extends BaseOnboardingStep {
  readonly target: 'board-cells';
  readonly cells: readonly GridPosition[];
  readonly expectedState: typeof CellState.Wall | typeof CellState.Floor;
  readonly guideClue?: {
    readonly axis: 'row' | 'column';
    readonly index: number;
  };
  /** Context only. GameScene must not draw a second colored overlay for these cells. */
  readonly focusCells?: readonly GridPosition[];
}

export type OnboardingStep = BoardCellsOnboardingStep;

type TutorialFlowMap = Readonly<Record<TutorialLevelId, readonly OnboardingStep[]>>;

const RU_FLOWS: TutorialFlowMap = {
  'tutorial-001': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
      message: 'Числа слева показывают количество стен в строках. Здесь 0 — отметь верхнюю строку как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
      message: 'ПОЛ — пометка «здесь нет стены». В нижней строке тоже 0 — отметь её клетки как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 1 }],
      message: 'Числа сверху показывают количество стен в столбцах. Слева 0 — отметь оставшуюся клетку как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 2 },
      cells: [{ x: 2, y: 1 }],
      message: 'Справа тоже 0 — отметь оставшуюся клетку как ПОЛ. Вне обучения помечать ПОЛ необязательно.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 1 },
      cells: [{ x: 1, y: 1 }],
      message: 'В средней строке нужна 1 СТЕНА. Единственная неизвестная клетка — в центре. Поставь стену, чтобы завершить уровень.',
    },
  ],
  'tutorial-002': [
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
      message: 'В этом столбце должно быть 4 стены. Клетка с монстром всегда открыта — поставь стены в остальных четырёх.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 0 }],
      focusCells: [{ x: 0, y: 0 }],
      message: 'У монстра ровно один соседний проход по стороне клетки. Снизу стена, слева и сверху край поля — справа ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
      message: 'В верхней строке нужны 3 стены. Монстр и ПОЛ занимают две клетки — поставь стены в остальных трёх.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 1 }],
      focusCells: [{ x: 1, y: 0 }],
      message: 'Тупик — клетка с одним проходом по стороне. Без монстра так нельзя: продолжи ПОЛ справа от монстра вниз.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 1 },
      cells: [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }],
      message: 'Одна стена уже стоит. Остальные клетки строки — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 4 },
      cells: [{ x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }],
      message: 'В нижней строке 5 клеток и нужны 5 стен. Одна уже стоит — поставь ещё четыре.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 4 },
      cells: [{ x: 4, y: 2 }, { x: 4, y: 3 }],
      message: 'В столбце уже есть 2 стены. Остальные клетки — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 3 },
      cells: [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
      message: 'В строке уже есть нужная стена. Остаток — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 1 },
      cells: [{ x: 1, y: 2 }],
      message: 'В столбце уже есть нужная стена. Осталась клетка ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
      message: 'В этой строке нужны 3 стены. Одна уже стоит, две клетки отмечены ПОЛОМ — поставь две недостающие стены.',
    },
  ],
  'tutorial-003': [
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
      message: 'В верхней строке нужны 4 стены. Клетка с монстром открыта — остальные четыре должны быть стенами.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 0, y: 1 }],
      focusCells: [{ x: 0, y: 0 }],
      message: 'У верхнего монстра остался один выход — вниз. Это ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 3 }],
      message: 'В первом столбце нужна 1 стена. Осталась одна неизвестная клетка.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 1, y: 2 }],
      focusCells: [{ x: 0, y: 2 }],
      message: 'У левого нижнего монстра проход уже сверху. Второй проход ему не нужен — справа должна быть СТЕНА.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 2 },
      cells: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
      message: 'В этом столбце уже есть нужная 1 стена. Остальное — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 1 }],
      message: 'Весь пол должен быть соединён по сторонам клеток. Диагональ не считается. Оставь проход из левой части — отметь ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 3, y: 2 }],
      message: 'В этой строке нужны 2 стены. Одна уже стоит — поставь вторую в единственной неизвестной клетке.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 1 },
      cells: [{ x: 1, y: 3 }],
      message: 'В столбце нужны 3 стены. Осталась одна неизвестная клетка.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 3 },
      cells: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
      message: 'В нижней строке уже стоят 2 стены. Остальное — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 1 },
      cells: [{ x: 3, y: 1 }, { x: 4, y: 1 }],
      message: 'В этой строке нужны 2 стены. Остались ровно две клетки.',
    },
  ],
  'tutorial-004': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 1 }, { x: 0, y: 2 }],
      message: 'В первом столбце 0 — стен нет. Клетки с монстрами уже открыты — отметь две оставшиеся как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 4 },
      cells: [{ x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
      message: 'В последнем столбце тоже 0. Отметь три клетки под монстром как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
      message: 'В верхней строке нужны 3 стены. Между монстрами ровно три клетки.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 2 },
      cells: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
      message: 'В этом столбце уже есть нужная 1 стена. Остальное — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 1, y: 3 }],
      focusCells: [{ x: 0, y: 3 }],
      message: 'У нижнего монстра выход уже сверху. Справа должна быть СТЕНА.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 3 },
      cells: [{ x: 3, y: 3 }],
      message: 'В строке уже есть нужная 1 стена. Последняя неизвестная клетка — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 3, y: 2 }],
      message: 'Квадрат 2×2 без стен разрешён только в комнате с сундуком. Здесь внизу справа три клетки уже ПОЛ — четвёртая СТЕНА.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 1, y: 2 }],
      message: 'В строке уже есть нужная 1 стена. Осталась клетка ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 3 },
      cells: [{ x: 3, y: 1 }],
      message: 'В столбце уже стоят нужные 2 стены. Остальная клетка — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 1 },
      cells: [{ x: 1, y: 1 }],
      message: 'В этом столбце нужны 3 стены. Осталась одна неизвестная клетка.',
    },
  ],
  'tutorial-005': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [
        { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
      ],
      focusCells: [{ x: 0, y: 0 }],
      message: 'Комната — квадрат 3×3 без стен с одним сундуком. Здесь сундук в углу поля — отметь комнату справа и снизу как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 3, y: 0 }, { x: 4, y: 0 }],
      message: 'В верхней строке нужны 2 стены. Остались ровно две клетки.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 1 },
      cells: [{ x: 3, y: 1 }, { x: 4, y: 1 }],
      message: 'Во второй строке тоже нужны 2 стены. Остались две клетки.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 3 }, { x: 0, y: 4 }],
      message: 'В первом столбце нужны 2 стены. Комната уже отмечена ПОЛОМ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 1 },
      cells: [{ x: 1, y: 3 }, { x: 1, y: 4 }],
      message: 'Во втором столбце тоже нужны 2 стены. Три клетки заняты комнатой — поставь стены в двух нижних.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 4 },
      cells: [{ x: 2, y: 4 }, { x: 3, y: 4 }],
      message: 'В нижней строке нужны 4 стены. Две уже стоят, клетка с монстром открыта — поставь ещё две стены.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 4, y: 3 }],
      focusCells: [{ x: 4, y: 4 }],
      message: 'У монстра остался один выход — вверх. Это ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 4 },
      cells: [{ x: 4, y: 2 }],
      message: 'В последнем столбце нужны 3 стены. Осталась одна неизвестная клетка.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 3 },
      cells: [{ x: 2, y: 3 }, { x: 3, y: 3 }],
      message: 'В этой строке уже стоят 2 стены. Остальные клетки — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 3, y: 2 }],
      focusCells: [{ x: 2, y: 3 }],
      message: 'У комнаты ровно один вход. Проход снизу уже отмечен ПОЛОМ. Поставь стену справа от комнаты, чтобы не было второго входа.',
    },
  ],
};

const EN_MESSAGES: Readonly<Record<TutorialLevelId, readonly string[]>> = {
  'tutorial-001': [
    'Numbers on the left count the WALLS in each row. This row has 0 — mark the top row as FLOOR.',
    'FLOOR means “no wall here”. The bottom row also has 0 — mark its cells as FLOOR.',
    'Numbers above count the WALLS in each column. The left column has 0 — mark its remaining cell as FLOOR.',
    'The right column also has 0 — mark its remaining cell as FLOOR. Outside the tutorial, FLOOR marks are optional.',
    'The middle row needs 1 WALL. Its only unknown cell is in the centre. Place the WALL to complete the level.',
  ],
  'tutorial-002': [
    'This column needs 4 WALLS. The Monster cell is always open — place WALLS in the other four cells.',
    'A Monster needs exactly one open side. A WALL below and board edges above and left leave only the right cell — FLOOR.',
    'The top row needs 3 WALLS. The Monster and FLOOR occupy two cells — place WALLS in the other three.',
    'A dead end has only one open side and must contain a Monster. Extend the FLOOR right of this Monster down.',
    'One WALL is already placed. The other cells in the row are FLOOR.',
    'The bottom row has 5 cells and needs 5 WALLS. One is already placed — add four more.',
    'This column already has its 2 WALLS. The remaining cells are FLOOR.',
    'This row already has its required WALL. The rest is FLOOR.',
    'This column already has its required WALL. The remaining cell is FLOOR.',
    'This row needs 3 WALLS. One is placed and two cells are FLOOR — place the two missing WALLS.',
  ],
  'tutorial-003': [
    'The top row needs 4 WALLS. The Monster cell is open — the other four cells must be WALLS.',
    'The upper Monster has one possible exit — downward. Mark it FLOOR.',
    'The first column needs 1 WALL. Only one unknown cell remains.',
    'The lower left Monster already has an open cell above. It must have no second exit — place a WALL on its right.',
    'This column already has its required 1 WALL. The rest is FLOOR.',
    'All open cells must connect through shared sides. Diagonals do not count. Join the left area to the rest — FLOOR.',
    'This row needs 2 WALLS. One is placed — put the second in the only unknown cell.',
    'This column needs 3 WALLS. Only one unknown cell remains.',
    'The bottom row already has 2 WALLS. The rest is FLOOR.',
    'This row needs 2 WALLS. Exactly two unknown cells remain.',
  ],
  'tutorial-004': [
    'The first column has 0 WALLS. The Monster cells are already open — mark the other two as FLOOR.',
    'The last column also has 0 WALLS. Mark the three cells below the Monster as FLOOR.',
    'The top row needs 3 WALLS. Exactly three cells lie between the Monsters.',
    'This column already has its required 1 WALL. The rest is FLOOR.',
    'The lower Monster already exits upward. The cell on its right must be a WALL.',
    'This row already has its required 1 WALL. The remaining unknown cell is FLOOR.',
    'An open 2×2 is allowed only in a Chest room. At the bottom right, three cells are FLOOR — make the fourth a WALL.',
    'This row already has its required 1 WALL. The remaining cell is FLOOR.',
    'This column already has its required 2 WALLS. The remaining cell is FLOOR.',
    'This column needs 3 WALLS. Only one unknown cell remains.',
  ],
  'tutorial-005': [
    'A room is an open 3×3 square with one Chest. This Chest is in the board corner — mark the room to its right and below as FLOOR.',
    'The top row needs 2 WALLS. Exactly two cells remain.',
    'The second row also needs 2 WALLS. Exactly two cells remain.',
    'The first column needs 2 WALLS. The room is already marked FLOOR.',
    'The second column also needs 2 WALLS. Three cells belong to the room — place WALLS in the bottom two.',
    'The bottom row needs 4 WALLS. Two are placed and the Monster cell is open — add two more WALLS.',
    'The Monster has one possible exit — upward. Mark it FLOOR.',
    'The last column needs 3 WALLS. Only one unknown cell remains.',
    'This row already has 2 WALLS. The remaining cells are FLOOR.',
    'A room has exactly one entrance, already marked FLOOR below. Place a WALL on the right to block a second entrance.',
  ],
};

export function createOnboardingFlow(
  levelId: string,
  language: SupportedLanguage = 'ru',
): readonly OnboardingStep[] {
  if (!(levelId in RU_FLOWS)) return [];
  const id = levelId as TutorialLevelId;
  const flow = RU_FLOWS[id];
  if (language === 'ru') return flow;
  const messages = EN_MESSAGES[id];
  return flow.map((step, index) => ({
    ...step,
    message: messages[index] ?? step.message,
  }));
}

export function isOnboardingStepSatisfied(
  step: OnboardingStep,
  getCellState: (x: number, y: number) => CellStateValue,
): boolean {
  return step.cells.every(
    ({ x, y }) => getCellState(x, y) === step.expectedState,
  );
}

/** Retained for compatibility with older callers; Campaign IDs now always resolve false. */
export function shouldShowContextualOnboarding(
  levelId: string,
  completedLevelIds: readonly string[],
): boolean {
  return createOnboardingFlow(levelId).length > 0
    && !completedLevelIds.includes(levelId);
}
