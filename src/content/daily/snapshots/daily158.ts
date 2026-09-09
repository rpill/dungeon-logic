import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-158",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    5,
    2,
    3,
    2,
    5
  ],
  "columnClues": [
    3,
    1,
    3,
    6,
    3,
    1,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 4,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....#.",
    "..##...",
    "#.###.#",
    "...#..#",
    "...##.#",
    "...#..#",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2857048906,
  "sourceCandidateId": "generated-mixed-one-room-7-2857048906",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
