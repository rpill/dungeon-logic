import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-180",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
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
    2,
    4,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 0,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "#.###..",
    "#....#.",
    "####...",
    "...#.##",
    ".....##",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3886031392,
  "sourceCandidateId": "generated-chest-one-room-7-3886031392",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 56
};
