import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-140",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    1,
    2,
    4,
    1,
    4
  ],
  "columnClues": [
    0,
    4,
    2,
    3,
    2,
    5,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#####",
    ".#...##",
    ".....#.",
    ".#...#.",
    ".####..",
    "......#",
    ".#.#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2951683091,
  "sourceCandidateId": "generated-mixed-one-room-7-2951683091",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
