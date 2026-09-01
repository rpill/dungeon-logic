import type { LevelDefinition } from '../../puzzle/types';

import { level001 } from './level001';
import { level002 } from './level002';
import { level003 } from './level003';

export {
  level001,
  level002,
  level003,
};

export const levels:
  readonly LevelDefinition[] = [
    level001,
    level002,
    level003,
  ];

export function resolveLevel(
  value: string | null,
): LevelDefinition {
  if (value === null) {
    return level001;
  }

  const levelNumber =
    Number(value);

  if (
    !Number.isInteger(
      levelNumber,
    )
  ) {
    return level001;
  }

  return (
    levels[levelNumber - 1] ??
    level001
  );
}