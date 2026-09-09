import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-074",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    2,
    1,
    3,
    6,
    5
  ],
  "columnClues": [
    0,
    4,
    3,
    3,
    3,
    5,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "......#",
    ".####..",
    ".#...#.",
    ".....#.",
    ".#...##",
    ".######",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 24138751,
  "sourceCandidateId": "generated-mixed-one-room-7-24138751",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
