import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-203",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    3,
    0,
    2,
    4,
    2
  ],
  "columnClues": [
    4,
    3,
    3,
    5,
    2,
    2,
    2
  ],
  "monsters": [
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
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####..#",
    "#####..",
    "...##.#",
    ".......",
    "...#.#.",
    "####...",
    "#....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1217544669,
  "sourceCandidateId": "generated-mixed-one-room-7-1217544669",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
