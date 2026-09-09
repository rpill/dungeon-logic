import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-153",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    3,
    0,
    4,
    3,
    5
  ],
  "columnClues": [
    3,
    3,
    2,
    2,
    2,
    4,
    5
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#.##",
    ".#...##",
    ".#.#.#.",
    ".......",
    "#.#.#.#",
    "#.#...#",
    "##..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2375336079,
  "sourceCandidateId": "generated-monster-only-7-2375336079",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
