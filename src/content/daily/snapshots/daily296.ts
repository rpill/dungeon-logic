import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-296",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    2,
    0,
    2,
    4,
    4
  ],
  "columnClues": [
    1,
    4,
    1,
    5,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#####",
    ".#.####",
    ".#.#...",
    ".......",
    ".#.#...",
    "...####",
    "##...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2985929877,
  "sourceCandidateId": "generated-mixed-one-room-7-2985929877",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
