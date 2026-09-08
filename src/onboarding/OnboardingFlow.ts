import { CellState, type CellState as CellStateValue } from '../puzzle/types';

export type OnboardingTarget =
  | 'clue'
  | 'tool-wall'
  | 'board-cell'
  | 'tool-floor'
  | 'message';

interface BaseOnboardingStep {
  readonly target: OnboardingTarget;
  readonly message: string;
}

export interface ClueOnboardingStep extends BaseOnboardingStep {
  readonly target: 'clue';
  readonly axis: 'row' | 'column';
  readonly index: number;
}

export interface ToolWallOnboardingStep extends BaseOnboardingStep {
  readonly target: 'tool-wall';
}

export interface ToolFloorOnboardingStep extends BaseOnboardingStep {
  readonly target: 'tool-floor';
}

export interface BoardCellOnboardingStep extends BaseOnboardingStep {
  readonly target: 'board-cell';
  readonly x: number;
  readonly y: number;
  /** Undefined means the cell is informational and advances via the callout. */
  readonly expectedState?: CellStateValue;
}

export interface MessageOnboardingStep extends BaseOnboardingStep {
  readonly target: 'message';
}

export type OnboardingStep =
  | ClueOnboardingStep
  | ToolWallOnboardingStep
  | ToolFloorOnboardingStep
  | BoardCellOnboardingStep
  | MessageOnboardingStep;

const FLOWS: Readonly<Record<string, readonly OnboardingStep[]>> = {
  'campaign-001': [
    {
      target: 'clue',
      axis: 'row',
      index: 0,
      message: 'Число слева показывает, сколько стен должно быть в строке. Здесь нужно 5 стен.',
    },
    {
      target: 'tool-wall',
      message: 'Сначала выбери СТЕНА. На компьютере стена ставится левой кнопкой мыши.',
    },
    {
      target: 'board-cell',
      x: 0,
      y: 0,
      expectedState: CellState.Wall,
      message: 'Поставь стену в подсвеченную клетку.',
    },
    {
      target: 'tool-floor',
      message: 'Строка с 0 не содержит стен. Выбери ПОЛ. На компьютере пол отмечается правой кнопкой мыши.',
    },
    {
      target: 'board-cell',
      x: 1,
      y: 5,
      expectedState: CellState.Floor,
      message: 'Отметь подсвеченную клетку как пол.',
    },
  ],
  'campaign-002': [
    {
      target: 'board-cell',
      x: 6,
      y: 2,
      message: 'Сундук всегда находится внутри комнаты 3×3. У комнаты ровно один вход.',
    },
    {
      target: 'board-cell',
      x: 5,
      y: 2,
      expectedState: CellState.Floor,
      message: 'Эта клетка находится внутри комнаты с сундуком. Отметь её как пол.',
    },
  ],
  'campaign-004': [
    {
      target: 'message',
      message: 'Теперь правила монстров и сундука работают вместе.',
    },
  ],
};

export function createOnboardingFlow(levelId: string): readonly OnboardingStep[] {
  return FLOWS[levelId] ?? [];
}

export function shouldShowContextualOnboarding(
  levelId: string,
  completedLevelIds: readonly string[],
): boolean {
  return createOnboardingFlow(levelId).length > 0
    && !completedLevelIds.includes(levelId);
}
