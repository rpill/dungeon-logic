import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-334",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    4,
    2,
    2,
    2,
    4,
    0
  ],
  "columnClues": [
    3,
    4,
    4,
    0,
    4,
    4,
    1
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.###",
    "##..##.",
    "#.#....",
    "....##.",
    ".##....",
    ".##.##.",
    "......."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3993337694,
  "sourceCandidateId": "generated-monster-only-7-3993337694",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};
