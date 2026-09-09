import { level as tutorial001 } from './levels/tutorial001';
import { level as tutorial002 } from './levels/tutorial002';
import { level as tutorial003 } from './levels/tutorial003';
import { level as tutorial004 } from './levels/tutorial004';
import type { TutorialLevelEntry } from './types';

export const TUTORIAL_MANIFEST: readonly TutorialLevelEntry[] = [
  { slot: 1, id: 'tutorial-001', level: tutorial001 },
  { slot: 2, id: 'tutorial-002', level: tutorial002 },
  { slot: 3, id: 'tutorial-003', level: tutorial003 },
  { slot: 4, id: 'tutorial-004', level: tutorial004 },
];

export function findTutorialEntry(id: string): TutorialLevelEntry | null {
  return TUTORIAL_MANIFEST.find((entry) => entry.id === id) ?? null;
}
