import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-210",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    1,
    4,
    0,
    5,
    1
  ],
  "columnClues": [
    4,
    3,
    3,
    5,
    2,
    1,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "####...",
    "...#...",
    ".#.##.#",
    ".......",
    "#.####.",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4143994345,
  "sourceCandidateId": "generated-chest-one-room-7-4143994345",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
