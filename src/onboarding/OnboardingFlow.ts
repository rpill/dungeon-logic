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
      message: '0 — стен нет. Отметь строку как ПОЛ.',
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
      message: 'Столбец 0 — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 2 },
      cells: [{ x: 2, y: 1 }],
      message: 'И справа 0 — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 1 },
      cells: [{ x: 1, y: 1 }],
      message: 'ПОЛ — лишь пометка. Для победы важны СТЕНЫ. Здесь нужна 1.',
    },
  ],
  'tutorial-002': [
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
      message: 'Монстру нужен тупик с одним выходом. Поставь 4 СТЕНЫ снизу.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 0 }],
      focusCells: [{ x: 0, y: 0 }],
      message: 'Остался один выход — отметь его как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 4 },
      cells: [{ x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
      message: 'Снизу та же логика: 4 СТЕНЫ над монстром.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 3, y: 4 }],
      focusCells: [{ x: 4, y: 4 }],
      message: 'Единственный выход слева — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 2 },
      cells: [{ x: 2, y: 1 }, { x: 2, y: 3 }],
      message: 'В средней колонке нужны 2 СТЕНЫ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 1, y: 1 }, { x: 3, y: 3 }],
      message: 'Последние 2 СТЕНЫ. Не создавай лишний тупик.',
    },
  ],
  'tutorial-003': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 4 },
      cells: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }],
      message: '0 — стен нет. Отметь нижнюю строку как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
      message: 'Слева тоже 0 — весь столбец ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 0 }, { x: 4, y: 3 }],
      message: 'Обычный проход не должен стать тупиком. Продолжения — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 1, y: 1 }, { x: 1, y: 3 }],
      message: 'В каждом 2×2 уже по 3 ПОЛА. Четвёртая клетка — СТЕНА.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 2, y: 0 }],
      message: 'У прохода снова один возможный выход — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 1 },
      cells: [{ x: 1, y: 2 }],
      message: 'В столбце уже 2 СТЕНЫ — остальное ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 2, y: 2 }],
      message: 'Этот проход нельзя превращать в тупик — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 3, y: 3 }],
      message: 'Три клетки 2×2 уже ПОЛ. Четвёртая — СТЕНА.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 3 },
      cells: [{ x: 2, y: 3 }],
      message: 'В строке уже 2 СТЕНЫ — остаток ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 2 },
      cells: [{ x: 2, y: 1 }],
      message: 'Столбцу нужна 1 СТЕНА. Осталась одна клетка.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 1 },
      cells: [{ x: 3, y: 1 }, { x: 4, y: 1 }],
      message: 'В строке уже 2 СТЕНЫ — остальное ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 3, y: 0 }],
      message: 'Продли проход: здесь должен быть ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 3 },
      cells: [{ x: 3, y: 2 }],
      message: 'В столбце не хватает одной СТЕНЫ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 4, y: 2 }],
      message: 'В строке уже есть нужная СТЕНА — остаток ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 4, y: 0 }],
      message: 'В верхней строке осталась единственная СТЕНА.',
    },
  ],
  'tutorial-004': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 5 },
      cells: [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }],
      message: '0 — вся нижняя строка ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'column', index: 0 },
      cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
      message: 'Слева тоже 0 — весь столбец ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
      focusCells: [{ x: 1, y: 1 }],
      message: 'Сундук должен быть внутри комнаты 3×3. Отметь её клетки как ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }],
      focusCells: [{ x: 0, y: 3 }],
      message: 'Вход уже снизу слева. Остальную границу комнаты закрой СТЕНАМИ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'row', index: 0 },
      cells: [{ x: 4, y: 0 }, { x: 5, y: 0 }],
      message: 'В верхней строке не хватает ещё 2 СТЕН.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 3 },
      cells: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }],
      message: 'В строке уже 2 СТЕНЫ — всё остальное ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      guideClue: { axis: 'column', index: 4 },
      cells: [{ x: 4, y: 2 }, { x: 4, y: 4 }],
      message: 'В столбце не хватает ещё 2 СТЕН.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 5, y: 1 }],
      focusCells: [{ x: 4, y: 1 }],
      message: 'Три стороны монстра закрыты. Единственный выход справа — ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      guideClue: { axis: 'row', index: 2 },
      cells: [{ x: 5, y: 2 }],
      message: 'В строке уже 2 СТЕНЫ — последняя клетка ПОЛ.',
    },
    {
      target: 'board-cells',
      expectedState: CellState.Wall,
      cells: [{ x: 1, y: 4 }, { x: 2, y: 4 }],
      message: 'В двух столбцах не хватает по одной СТЕНЕ. Поставь последние две.',
    },
  ],
};
const EN_MESSAGES: Readonly<Record<TutorialLevelId, readonly string[]>> = {
  'tutorial-001': [
    '0 means no walls. Mark the row as FLOOR.',
    'Another 0 — FLOOR here too.',
    'Column 0 — FLOOR.',
    'The right 0 — FLOOR.',
    'FLOOR is only a solving mark. Winning depends on the WALLS. This row needs 1.',
  ],
  'tutorial-002': [
    'A Monster needs a dead end with one exit. Place 4 WALLS below it.',
    'One exit remains — mark it as FLOOR.',
    'Same idea below: 4 WALLS above the Monster.',
    'The only exit on the left is FLOOR.',
    'The middle column needs 2 WALLS.',
    'Final 2 WALLS. Do not create an extra dead end.',
  ],
  'tutorial-003': [
    '0 means no walls. Mark the bottom row as FLOOR.',
    'The left clue is also 0 — the whole column is FLOOR.',
    'A normal passage must not become a dead end. Mark the continuations as FLOOR.',
    'Each 2×2 already has 3 FLOOR cells. The fourth cell is a WALL.',
    'The passage has only one possible continuation again — FLOOR.',
    'This column already has 2 WALLS — the rest is FLOOR.',
    'Do not turn this passage into a dead end — FLOOR.',
    'Three cells in this 2×2 are FLOOR. The fourth is a WALL.',
    'This row already has 2 WALLS — the rest is FLOOR.',
    'The column needs 1 WALL. Only one cell remains.',
    'This row already has 2 WALLS — the rest is FLOOR.',
    'Continue the passage: this cell must be FLOOR.',
    'This column is missing one WALL.',
    'This row already has its WALL — the rest is FLOOR.',
    'Only one WALL remains in the top row.',
  ],
  'tutorial-004': [
    '0 means the whole bottom row is FLOOR.',
    'The left clue is also 0 — the whole column is FLOOR.',
    'The Chest must sit inside a 3×3 room. Mark its cells as FLOOR.',
    'The entrance is already at bottom-left. Close the rest of the room border with WALLS.',
    'The top row still needs 2 WALLS.',
    'This row already has 2 WALLS — everything else is FLOOR.',
    'This column still needs 2 WALLS.',
    'Three sides of the Monster are closed. Its only exit on the right is FLOOR.',
    'This row already has 2 WALLS — the last cell is FLOOR.',
    'Two columns need one more WALL each. Place the final two.',
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
