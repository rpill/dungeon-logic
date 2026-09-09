import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-109",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    1,
    4,
    2,
    2,
    5
  ],
  "columnClues": [
    1,
    4,
    5,
    2,
    3,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".###.##",
    ".###.##",
    "......#",
    "#.#.#.#",
    "....#.#",
    ".##....",
    ".##.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1936823272,
  "sourceCandidateId": "generated-monster-only-7-1936823272",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};
