import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-343",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    5,
    0,
    4,
    2,
    3
  ],
  "columnClues": [
    6,
    5,
    0,
    4,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
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
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##....#",
    "##.##..",
    "##.##.#",
    ".......",
    "##.#.#.",
    "#..#...",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1407471372,
  "sourceCandidateId": "generated-monster-only-7-1407471372",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};
