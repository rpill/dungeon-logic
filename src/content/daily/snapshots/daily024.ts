import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-024",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    4,
    3,
    2,
    3,
    5
  ],
  "columnClues": [
    4,
    3,
    1,
    3,
    5,
    1,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#.#.",
    ".#.....",
    ".#.##.#",
    "#...#.#",
    "#...#..",
    "#...#.#",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2917799764,
  "sourceCandidateId": "generated-mixed-one-room-7-2917799764",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 54,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
