import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-231",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    1,
    2,
    2,
    5,
    4
  ],
  "columnClues": [
    0,
    3,
    4,
    3,
    2,
    6,
    4
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
      "y": 1
    },
    {
      "x": 1,
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
    "..##.##",
    ".###.#.",
    ".....#.",
    ".#.#...",
    ".....##",
    ".##.###",
    "..#.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3228884252,
  "sourceCandidateId": "generated-monster-only-7-3228884252",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
