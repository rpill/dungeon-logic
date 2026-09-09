import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-332",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    4,
    2,
    0,
    3,
    5
  ],
  "columnClues": [
    2,
    3,
    2,
    5,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 0,
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
    "##.####",
    ".#...##",
    "...####",
    ".#.#...",
    ".......",
    "#.##...",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1926525245,
  "sourceCandidateId": "generated-mixed-one-room-7-1926525245",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
