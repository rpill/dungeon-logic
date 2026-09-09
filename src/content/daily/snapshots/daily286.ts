import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-286",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    2,
    2,
    2,
    5,
    5
  ],
  "columnClues": [
    1,
    2,
    5,
    2,
    5,
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
      "y": 4
    },
    {
      "x": 3,
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
    "..#####",
    "#.#....",
    "....##.",
    ".##....",
    "....#.#",
    ".##.###",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1796161153,
  "sourceCandidateId": "generated-monster-only-7-1796161153",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
