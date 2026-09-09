import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-283",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    3,
    4,
    0,
    4,
    4
  ],
  "columnClues": [
    5,
    4,
    3,
    3,
    1,
    3,
    1
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 2,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "#.#.#..",
    "##...#.",
    ".###.#.",
    ".......",
    "##.#.#.",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1936131724,
  "sourceCandidateId": "generated-monster-only-7-1936131724",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
