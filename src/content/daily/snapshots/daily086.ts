import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-086",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    2,
    0,
    3,
    4,
    2
  ],
  "columnClues": [
    4,
    3,
    3,
    3,
    2,
    2,
    3
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 3,
      "y": 1
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
      "x": 1,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####..#",
    "###..#.",
    "...#.#.",
    ".......",
    "...##.#",
    "###...#",
    "#...#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2816173738,
  "sourceCandidateId": "generated-mixed-one-room-7-2816173738",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
