import type { LevelDefinition } from '../../puzzle/types';

import { level001 } from './level001';
import { level002 } from './level002';
import { level003 } from './level003';
import { level004 } from './level004';
import { level005 } from './level005';
import { level006 } from './level006';
import { level007 } from './level007';
import { level008 } from './level008';
import { level009 } from './level009';
import { level010 } from './level010';
import { level011 } from './level011';
import { level012 } from './level012';

export {
  level001,
  level002,
  level003,
  level004,
  level005,
  level006,
  level007,
  level008,
  level009,
  level010,
  level011,
  level012,
};

export const levels:
  readonly LevelDefinition[] = [
  level001,
  level002,
  level003,
  level004,
  level005,
  level006,
  level007,
  level008,
  level009,
  level010,
  level011,
  level012,
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
