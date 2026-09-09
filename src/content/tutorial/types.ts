import type { LevelDefinition } from '../../puzzle/types';

export type TutorialLevelId =
  | 'tutorial-001'
  | 'tutorial-002'
  | 'tutorial-003'
  | 'tutorial-004';

export interface TutorialLevelEntry {
  readonly slot: 1 | 2 | 3 | 4;
  readonly id: TutorialLevelId;
  readonly level: LevelDefinition;
}
