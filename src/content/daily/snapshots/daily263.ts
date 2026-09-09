import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-263",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    4,
    1,
    3,
    2
  ],
  "columnClues": [
    4,
    3,
    0,
    2,
    4,
    2,
    5
  ],
  "monsters": [
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
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
      "x": 3,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#...#.#",
    "#...#.#",
    ".#.##.#",
    ".#.....",
    "...#.##",
    "##....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1716593679,
  "sourceCandidateId": "generated-mixed-one-room-7-1716593679",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
