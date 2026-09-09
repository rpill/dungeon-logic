import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-162",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    3,
    5,
    3,
    1,
    4
  ],
  "columnClues": [
    4,
    2,
    1,
    3,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...##.#",
    "##.....",
    "...#.##",
    "##.#.##",
    "#...##.",
    "..#....",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2058349565,
  "sourceCandidateId": "generated-monster-only-7-2058349565",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
