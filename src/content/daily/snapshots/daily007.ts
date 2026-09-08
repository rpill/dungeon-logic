import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-007",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    2,
    2,
    3,
    5,
    2
  ],
  "columnClues": [
    1,
    1,
    1,
    4,
    3,
    5,
    5
  ],
  "monsters": [
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    "...#..#",
    "...#.#.",
    "#.#....",
    "....###",
    ".#.####",
    ".....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2632286051,
  "sourceCandidateId": "generated-mixed-one-room-7-2632286051",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
