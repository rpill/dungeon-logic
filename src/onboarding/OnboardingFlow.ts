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
}

export interface MessageOnboardingStep extends BaseOnboardingStep {
  readonly target: 'message';
  readonly autoAdvanceMs: number;
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
      message: 'Число 5 означает пять стен в строке. Здесь уже стоит монстр, поэтому остальные пять клеток — стены. Поставь их.',
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
      message: 'Число 0 означает: стен в строке нет. Отметь остальные клетки этой строки как пол.',
    },
  ],
  'campaign-002': [
    {
      target: 'board-cells',
      expectedState: CellState.Floor,
      cells: [{ x: 5, y: 2 }],
      message: 'Сундук находится внутри комнаты 3×3 с ровно одним входом. Подсвеченная соседняя клетка — часть комнаты: отметь её как пол.',
    },
  ],
  'campaign-004': [
    {
      target: 'message',
      autoAdvanceMs: 1700,
      message: 'Теперь правила монстров и сундука работают вместе.',
    },
  ],
};

export function createOnboardingFlow(levelId: string): readonly OnboardingStep[] {
  return FLOWS[levelId] ?? [];
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
