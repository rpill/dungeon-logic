import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-145",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    2,
    2,
    5,
    2
  ],
  "columnClues": [
    4,
    1,
    3,
    1,
    4,
    1,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#.###",
    "#.....#",
    "..#.#.#",
    "#.#....",
    "....#.#",
    "##.##.#",
    "#.....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1368263161,
  "sourceCandidateId": "generated-monster-only-7-1368263161",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
