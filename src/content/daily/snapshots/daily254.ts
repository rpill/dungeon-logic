import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-254",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    5,
    3,
    6,
    1,
    1,
    4
  ],
  "columnClues": [
    2,
    5,
    1,
    4,
    2,
    3,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".......",
    ".#.####",
    ".#...##",
    "##.####",
    "...#...",
    ".#.....",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1398270830,
  "sourceCandidateId": "generated-mixed-one-room-7-1398270830",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
