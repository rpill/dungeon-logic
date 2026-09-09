import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-364",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    5,
    1,
    4,
    5,
    0
  ],
  "columnClues": [
    6,
    5,
    2,
    2,
    2,
    2,
    3
  ],
  "monsters": [
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
      "y": 3
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
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
    "###...#",
    "##..#..",
    "###.#.#",
    "#......",
    "##.#.#.",
    "##.#.##",
    "......."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 92135540,
  "sourceCandidateId": "generated-monster-only-7-92135540",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
