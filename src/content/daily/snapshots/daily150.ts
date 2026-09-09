import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-150",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    3,
    4,
    3,
    0,
    4
  ],
  "columnClues": [
    1,
    4,
    3,
    4,
    1,
    4,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 5,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    ".###.##",
    ".#...##",
    "...####",
    ".###...",
    ".......",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 535200495,
  "sourceCandidateId": "generated-chest-one-room-7-535200495",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
