import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-090",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    2,
    2,
    3,
    3,
    3
  ],
  "columnClues": [
    4,
    2,
    3,
    4,
    1,
    5,
    0
  ],
  "monsters": [],
  "chests": [
    {
      "x": 0,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "...#.#.",
    "...#.#.",
    "...#.#.",
    "#.#..#.",
    "#...##.",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1551236418,
  "sourceCandidateId": "generated-chest-one-room-7-1551236418",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 44
};
