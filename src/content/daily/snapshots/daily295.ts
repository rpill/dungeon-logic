import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-295",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    5,
    3,
    3,
    5,
    2,
    2
  ],
  "columnClues": [
    4,
    1,
    4,
    0,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
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
    "#......",
    "#.#.###",
    "....###",
    "#.#...#",
    "#.#.###",
    "....##.",
    ".##...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2410024150,
  "sourceCandidateId": "generated-monster-only-7-2410024150",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
