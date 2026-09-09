import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-270",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    3,
    4,
    3,
    0,
    4
  ],
  "columnClues": [
    2,
    3,
    3,
    4,
    1,
    4,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....##",
    "..##.##",
    ".#...##",
    "...####",
    ".###...",
    ".......",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2277765604,
  "sourceCandidateId": "generated-chest-one-room-7-2277765604",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
