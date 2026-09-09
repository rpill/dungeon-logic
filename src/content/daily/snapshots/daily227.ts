import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-227",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    2,
    6,
    1,
    1,
    1
  ],
  "columnClues": [
    1,
    2,
    3,
    3,
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
      "x": 3,
      "y": 0
    },
    {
      "x": 4,
      "y": 2
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#.###",
    ".##.###",
    ".....##",
    "#.#####",
    "...#...",
    ".#.....",
    "...#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2800265427,
  "sourceCandidateId": "generated-mixed-one-room-7-2800265427",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};
