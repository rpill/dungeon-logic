import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-178",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    6,
    1,
    5,
    2,
    2,
    2
  ],
  "columnClues": [
    4,
    4,
    5,
    0,
    4,
    3,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.###",
    "###.###",
    "......#",
    "###.#.#",
    "#.#....",
    "....##.",
    ".##...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1407555738,
  "sourceCandidateId": "generated-monster-only-7-1407555738",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
