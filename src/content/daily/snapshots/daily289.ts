import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-289",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    1,
    3,
    3,
    4,
    4
  ],
  "columnClues": [
    1,
    3,
    1,
    4,
    4,
    4,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 4,
      "y": 4
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
    "#.##..#",
    "...##.#",
    ".#.....",
    "...###.",
    ".#...##",
    "...####",
    ".#..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 651100605,
  "sourceCandidateId": "generated-monster-only-7-651100605",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
