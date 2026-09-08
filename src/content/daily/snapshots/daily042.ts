import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-042",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    3,
    3,
    2,
    2
  ],
  "columnClues": [
    6,
    4,
    3,
    1,
    3,
    3,
    1
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####..",
    "##...#.",
    "##...#.",
    "##...#.",
    "#.#.#..",
    "..#...#",
    "#...#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2717993136,
  "sourceCandidateId": "generated-mixed-one-room-7-2717993136",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 56
};
