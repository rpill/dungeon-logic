import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-220",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    3,
    3,
    2,
    3,
    3
  ],
  "columnClues": [
    5,
    3,
    1,
    2,
    2,
    6,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
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
    "....###",
    "##.#.#.",
    "##...#.",
    "##.#...",
    "#....#.",
    "..#.##.",
    "#....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1762605915,
  "sourceCandidateId": "generated-monster-only-7-1762605915",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 63,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
