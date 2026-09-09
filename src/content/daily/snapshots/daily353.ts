import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-353",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    4,
    1,
    3,
    1
  ],
  "columnClues": [
    5,
    3,
    3,
    0,
    2,
    4,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...##",
    "##...##",
    "##...#.",
    "#.#.##.",
    "..#....",
    "#...#.#",
    "..#...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1452926283,
  "sourceCandidateId": "generated-mixed-one-room-7-1452926283",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
