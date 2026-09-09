import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-292",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    5,
    1,
    4,
    3,
    3,
    6
  ],
  "columnClues": [
    6,
    4,
    2,
    3,
    1,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "......#",
    "###.#.#",
    "#......",
    "##.#.#.",
    "##.#...",
    "#....##",
    "####.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 697717169,
  "sourceCandidateId": "generated-monster-only-7-697717169",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
