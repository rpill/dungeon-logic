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
      message: '0 — стен в этой строке нет. Отметь клетки как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
      message: 'Ещё один 0 — здесь тоже ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 1 }],
      message: 'В левом столбце 0 — оставшаяся клетка тоже ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 2 },
      cells: [{ x: 2, y: 1 }],
      message: 'Справа тоже 0 — оставшаяся клетка ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 1 },
      cells: [{ x: 1, y: 1 }],
      message: 'Здесь нужна 1 СТЕНА. Осталась одна неизвестная клетка.\nПОЛ — только удобная пометка.',
    },
  ],
  'tutorial-002': [
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
      message: 'В этом столбце должно быть 4 стены. Монстр не может быть стеной.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 0 }],
      focusCells: [{ x: 0, y: 0 }],
      message: 'У монстра должен остаться один выход. Остался только справа — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
      message: 'В верхней строке нужны 3 стены. Две клетки уже не стены.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 1 }],
      focusCells: [{ x: 1, y: 0 }],
      message: 'Тупик должен содержать монстра. Продолжение вниз должно остаться ПОЛОМ.',
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
      message: '5 — вся строка состоит из стен.',
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
      message: 'Нужны 3 стены. Одна уже стоит, две клетки уже ПОЛ.',
    },
  ],
  'tutorial-003': [
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
      message: 'В верхней строке нужны 4 стены. Монстр занимает единственный проход.',
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
      message: 'У этого монстра выход уже сверху. Справа должен быть СТЕНА.',
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
      message: 'Весь ПОЛ должен быть соединён. Если закрыть эту клетку, левая часть отрежется.\nДиагональ клетки не соединяет.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 3, y: 2 }],
      message: 'В этой строке нужны 2 стены. Одной ещё не хватает.',
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
      message: 'В первом столбце 0 — обычные клетки здесь ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 4 },
      cells: [{ x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
      message: 'В последнем столбце тоже 0 — клетки ПОЛ.',
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
      message: 'В строке уже есть нужная 1 стена. Остальная неизвестная клетка — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 3, y: 2 }],
      message: 'Вне комнаты открытого квадрата 2×2 быть не может. Три клетки уже ПОЛ — четвёртая СТЕНА.',
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
      message: 'Сундук находится в комнате ровно 3×3. Здесь её положение может быть только одно — отметь комнату как ПОЛ.',
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
      message: 'Во втором столбце тоже нужны 2 стены.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 4 },
      cells: [{ x: 2, y: 4 }, { x: 3, y: 4 }],
      message: 'В нижней строке нужны 4 стены. Монстр не может быть стеной.',
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
      message: 'У комнаты ровно один вход. Внизу он уже ПОЛ — правую границу закрой СТЕНОЙ.',
    },
  ],
};

const EN_MESSAGES: Readonly<Record<TutorialLevelId, readonly string[]>> = {
  'tutorial-001': [
    '0 means there are no walls in this row. Mark the cells as FLOOR.',
    'Another 0 — FLOOR here too.',
    'The left column is 0 — its remaining cell is FLOOR.',
    'The right column is also 0 — its remaining cell is FLOOR.',
    'This row needs 1 WALL. Only one unknown cell remains.\nFLOOR is only a helpful solving mark.',
  ],
  'tutorial-002': [
    'This column must contain 4 WALLS. A Monster cannot be a wall.',
    'A Monster must have one exit. Only the cell on the right remains — FLOOR.',
    'The top row needs 3 WALLS. Two cells are already not walls.',
    'Every dead end must contain a Monster. The passage must continue downward as FLOOR.',
    'One WALL is already placed. The other cells in the row are FLOOR.',
    '5 means the entire row is WALLS.',
    'This column already has its 2 WALLS. The remaining cells are FLOOR.',
    'This row already has its required WALL. The rest is FLOOR.',
    'This column already has its required WALL. The remaining cell is FLOOR.',
    'The row needs 3 WALLS. One is placed and two cells are already FLOOR.',
  ],
  'tutorial-003': [
    'The top row needs 4 WALLS. The Monster is its only open cell.',
    'The upper Monster has one possible exit — downward. Mark it FLOOR.',
    'The first column needs 1 WALL. Only one unknown cell remains.',
    'This Monster already exits upward. The cell on its right must be a WALL.',
    'This column already has its required 1 WALL. The rest is FLOOR.',
    'All FLOOR must stay connected. Closing this cell would cut the left side off.\nDiagonal cells do not connect.',
    'This row needs 2 WALLS. One more is required.',
    'This column needs 3 WALLS. Only one unknown cell remains.',
    'The bottom row already has 2 WALLS. The rest is FLOOR.',
    'This row needs 2 WALLS. Exactly two unknown cells remain.',
  ],
  'tutorial-004': [
    'The first column is 0 — its ordinary cells are FLOOR.',
    'The last column is also 0 — mark its cells FLOOR.',
    'The top row needs 3 WALLS. Exactly three cells lie between the Monsters.',
    'This column already has its required 1 WALL. The rest is FLOOR.',
    'The lower Monster already exits upward. The cell on its right must be a WALL.',
    'This row already has its required 1 WALL. The remaining unknown cell is FLOOR.',
    'Outside a room, an open 2×2 square is forbidden. Three cells are FLOOR — the fourth is a WALL.',
    'This row already has its required 1 WALL. The remaining cell is FLOOR.',
    'This column already has its required 2 WALLS. The remaining cell is FLOOR.',
    'This column needs 3 WALLS. Only one unknown cell remains.',
  ],
  'tutorial-005': [
    'A Chest is inside a room exactly 3×3. Here the room can only be in one place — mark it as FLOOR.',
    'The top row needs 2 WALLS. Exactly two cells remain.',
    'The second row also needs 2 WALLS. Exactly two cells remain.',
    'The first column needs 2 WALLS. The room is already marked FLOOR.',
    'The second column also needs 2 WALLS.',
    'The bottom row needs 4 WALLS. A Monster cannot be a wall.',
    'The Monster has one possible exit — upward. Mark it FLOOR.',
    'The last column needs 3 WALLS. Only one unknown cell remains.',
    'This row already has 2 WALLS. The remaining cells are FLOOR.',
    'A room has exactly one entrance. The bottom entrance is already FLOOR — close the right boundary with a WALL.',
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
