import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-124",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    4,
    3,
    2,
    3,
    1
  ],
  "columnClues": [
    5,
    0,
    4,
    0,
    4,
    5,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
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
    "#.#.###",
    "#...###",
    "#.#..##",
    "....###",
    "#.#....",
    "#...##.",
    "..#...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3185438899,
  "sourceCandidateId": "generated-monster-only-7-3185438899",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
