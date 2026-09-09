import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-327",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    6,
    2,
    4,
    0,
    4,
    1
  ],
  "columnClues": [
    2,
    2,
    1,
    3,
    4,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    "##.####",
    ".....##",
    ".#.##.#",
    ".......",
    "#.#.#.#",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1492884083,
  "sourceCandidateId": "generated-monster-only-7-1492884083",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
