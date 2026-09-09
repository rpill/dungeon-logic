import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-225",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    2,
    2,
    2,
    3,
    4
  ],
  "columnClues": [
    4,
    4,
    3,
    3,
    4,
    0,
    4
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 3,
      "y": 6
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
    "#####.#",
    "#.#...#",
    "...##..",
    ".#....#",
    "...##..",
    "##....#",
    "###.#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 296652035,
  "sourceCandidateId": "generated-monster-only-7-296652035",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
