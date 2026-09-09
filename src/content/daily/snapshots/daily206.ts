import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-206",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    3,
    4,
    4,
    3,
    4
  ],
  "columnClues": [
    2,
    3,
    1,
    4,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 4,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..##...",
    "#......",
    "##.#...",
    ".#..###",
    "...####",
    ".#...##",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 805584332,
  "sourceCandidateId": "generated-mixed-one-room-7-805584332",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
