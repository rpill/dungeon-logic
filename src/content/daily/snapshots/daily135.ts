import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-135",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    2,
    1,
    5,
    2,
    2
  ],
  "columnClues": [
    2,
    4,
    2,
    2,
    3,
    5,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 4,
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
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...##",
    ".#.####",
    "...#.#.",
    ".#.....",
    ".##.###",
    "....##.",
    "#.#...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 283198297,
  "sourceCandidateId": "generated-monster-only-7-283198297",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
