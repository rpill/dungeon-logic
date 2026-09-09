import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-215",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    1,
    1,
    6,
    5,
    2,
    4
  ],
  "columnClues": [
    4,
    3,
    3,
    4,
    3,
    1,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
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
  "chests": [
    {
      "x": 0,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    ".....#.",
    "...#...",
    "#####.#",
    "#####..",
    "#.....#",
    "###.#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1039284788,
  "sourceCandidateId": "generated-mixed-one-room-7-1039284788",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
