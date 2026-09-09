import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-131",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    3,
    4,
    1,
    4,
    4
  ],
  "columnClues": [
    1,
    3,
    1,
    3,
    2,
    6,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 4,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#...##",
    ".....##",
    ".#...##",
    "..####.",
    "#......",
    ".#.#.##",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3274739592,
  "sourceCandidateId": "generated-mixed-one-room-7-3274739592",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
