import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-342",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    4,
    0,
    5,
    2,
    4
  ],
  "columnClues": [
    6,
    3,
    3,
    2,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.#.#.",
    "#......",
    "#.##.#.",
    ".......",
    "###.#.#",
    "#...#..",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1852935177,
  "sourceCandidateId": "generated-monster-only-7-1852935177",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};
