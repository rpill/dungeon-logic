import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-166",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    4,
    1,
    3,
    5,
    3,
    5
  ],
  "columnClues": [
    5,
    0,
    5,
    3,
    2,
    2,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
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
    ".......",
    "#.#.#.#",
    "....#..",
    "#.#...#",
    "#.##.##",
    "#.##...",
    "#.##.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 582018653,
  "sourceCandidateId": "generated-monster-only-7-582018653",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};
