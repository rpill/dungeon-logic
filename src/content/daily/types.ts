import type { LevelDefinition } from '../../puzzle/types';

export interface DailyEntry {
  readonly id: string;
  readonly dateKey: string;
  readonly level: LevelDefinition;
}
