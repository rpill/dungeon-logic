import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-258",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    2,
    2,
    2,
    4,
    5
  ],
  "columnClues": [
    6,
    2,
    4,
    1,
    2,
    4,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
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
    "##.....",
    "#.##.#.",
    "#.#....",
    "....##.",
    "#.#....",
    "#...###",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1796308248,
  "sourceCandidateId": "generated-monster-only-7-1796308248",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
