import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-036",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    5,
    0,
    5,
    3
  ],
  "columnClues": [
    3,
    2,
    2,
    1,
    5,
    4,
    3
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "....#.#",
    ".##....",
    "....###",
    "#.#.###",
    ".......",
    "##.###.",
    "#...##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3119498482,
  "sourceCandidateId": "generated-monster-only-7-3119498482",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
