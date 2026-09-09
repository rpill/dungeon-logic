import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-144",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    1,
    2,
    4,
    2
  ],
  "columnClues": [
    5,
    4,
    3,
    4,
    1,
    2,
    1
  ],
  "monsters": [
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "###..#.",
    "#.##...",
    ".....#.",
    ".#.#...",
    "#..##.#",
    "##....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4184638575,
  "sourceCandidateId": "generated-monster-only-7-4184638575",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
