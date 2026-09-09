import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-229",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    2,
    4,
    4,
    2,
    5
  ],
  "columnClues": [
    5,
    3,
    5,
    3,
    1,
    3,
    1
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##....",
    "....##.",
    "#.#....",
    "#.##.#.",
    "####...",
    "#....#.",
    "####..#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2509557031,
  "sourceCandidateId": "generated-monster-only-7-2509557031",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 68,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
