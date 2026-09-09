import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-308",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    2,
    0,
    3,
    5,
    3
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
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#..###",
    "...####",
    ".#.#...",
    ".......",
    "#.##...",
    "#.#.###",
    "....###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1257688169,
  "sourceCandidateId": "generated-mixed-one-room-7-1257688169",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
