import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-122",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    3,
    3,
    3,
    3,
    1
  ],
  "columnClues": [
    2,
    3,
    2,
    1,
    2,
    5,
    6
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....##",
    "..#####",
    ".#...##",
    ".#...##",
    ".#...##",
    "..#.#.#",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3481355750,
  "sourceCandidateId": "generated-mixed-one-room-7-3481355750",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
