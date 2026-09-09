import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-101",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    2,
    3,
    3,
    5
  ],
  "columnClues": [
    5,
    3,
    1,
    3,
    4,
    1,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.....",
    "...#.#.",
    ".#.#..#",
    "#...#..",
    "#...#.#",
    "#...#.#",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2660400659,
  "sourceCandidateId": "generated-mixed-one-room-7-2660400659",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 42,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};
