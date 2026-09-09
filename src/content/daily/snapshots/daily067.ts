import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-067",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    5,
    5,
    1,
    3,
    2,
    3
  ],
  "columnClues": [
    4,
    5,
    2,
    4,
    2,
    4,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.##",
    "##.#.##",
    "##.#.##",
    "......#",
    ".#.##..",
    "....##.",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3269326994,
  "sourceCandidateId": "generated-monster-only-7-3269326994",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
