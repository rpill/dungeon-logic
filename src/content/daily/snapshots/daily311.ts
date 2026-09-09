import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-311",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    5,
    2,
    4,
    3,
    1,
    2
  ],
  "columnClues": [
    3,
    4,
    1,
    5,
    3,
    3,
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
      "x": 5,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.####",
    ".#.####",
    ".#....#",
    "...####",
    "##.#...",
    "#......",
    "..##..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 711251424,
  "sourceCandidateId": "generated-mixed-one-room-7-711251424",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
