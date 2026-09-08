import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-043",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    2,
    4,
    3,
    2,
    4
  ],
  "columnClues": [
    4,
    1,
    2,
    4,
    1,
    5,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 1,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....##",
    "#.##...",
    "#....#.",
    "####...",
    "...#.##",
    ".....##",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2529247727,
  "sourceCandidateId": "generated-chest-one-room-7-2529247727",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 62
};
