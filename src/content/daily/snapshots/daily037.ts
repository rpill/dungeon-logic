import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-037",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    0,
    2,
    3,
    5
  ],
  "columnClues": [
    2,
    2,
    2,
    3,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 3,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#.###",
    "#...###",
    "#.##...",
    ".......",
    ".#.#...",
    "....###",
    ".#.####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1462676595,
  "sourceCandidateId": "generated-mixed-one-room-7-1462676595",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 44
};
