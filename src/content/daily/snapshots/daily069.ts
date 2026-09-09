import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-069",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    3,
    4,
    1,
    3,
    3
  ],
  "columnClues": [
    2,
    2,
    2,
    3,
    5,
    4,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
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
    "..#####",
    ".#..###",
    "...##.#",
    ".#.##.#",
    "#......",
    "..#.##.",
    "#....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3208270954,
  "sourceCandidateId": "generated-monster-only-7-3208270954",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
