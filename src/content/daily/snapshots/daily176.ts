import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-176",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    2,
    5,
    2,
    3,
    4
  ],
  "columnClues": [
    6,
    2,
    4,
    6,
    1,
    1,
    1
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
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
    "##.#...",
    "#....#.",
    "..##...",
    "#.###.#",
    "#..#...",
    "#.##...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2087554725,
  "sourceCandidateId": "generated-mixed-one-room-7-2087554725",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
