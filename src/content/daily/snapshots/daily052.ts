import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-052",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    4,
    5,
    3,
    2,
    3
  ],
  "columnClues": [
    6,
    4,
    3,
    2,
    2,
    3,
    1
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 5,
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
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...#.#",
    "..#....",
    "#.##.#.",
    "#####..",
    "##...#.",
    "##.....",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1331311834,
  "sourceCandidateId": "generated-mixed-one-room-7-1331311834",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 47
};
