import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-116",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    0,
    4,
    3,
    3,
    2,
    4
  ],
  "columnClues": [
    6,
    3,
    2,
    4,
    3,
    0,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.##.#",
    ".......",
    "#.#.#.#",
    "#...#.#",
    "##.#...",
    "#..#...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 799122315,
  "sourceCandidateId": "generated-mixed-one-room-7-799122315",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
