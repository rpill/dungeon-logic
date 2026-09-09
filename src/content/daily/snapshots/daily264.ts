import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-264",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    3,
    3,
    5,
    6
  ],
  "columnClues": [
    5,
    3,
    3,
    4,
    0,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
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
      "x": 5,
      "y": 5
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
    ".....##",
    "#.##...",
    ".....#.",
    "##.#...",
    "#....##",
    "####..#",
    "####.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2780033837,
  "sourceCandidateId": "generated-monster-only-7-2780033837",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
