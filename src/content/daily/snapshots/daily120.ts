import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-120",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    1,
    5,
    0,
    5,
    4
  ],
  "columnClues": [
    1,
    2,
    1,
    5,
    3,
    5,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 0,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".....##",
    "...#...",
    "####.#.",
    ".......",
    ".#.####",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2335151862,
  "sourceCandidateId": "generated-chest-one-room-7-2335151862",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 42,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
