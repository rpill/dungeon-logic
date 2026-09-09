import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-128",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    2,
    2,
    3,
    5,
    5
  ],
  "columnClues": [
    1,
    3,
    2,
    3,
    3,
    5,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "......#",
    ".####..",
    ".#...#.",
    ".....##",
    ".#...##",
    "..#####",
    "#..####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2907831801,
  "sourceCandidateId": "generated-mixed-one-room-7-2907831801",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
