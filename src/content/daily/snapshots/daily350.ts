import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-350",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    2,
    2,
    2,
    5,
    5
  ],
  "columnClues": [
    4,
    1,
    3,
    3,
    3,
    3,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 2,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.....",
    "#..###.",
    "..#...#",
    "#.....#",
    "..#...#",
    "#..####",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3253591459,
  "sourceCandidateId": "generated-mixed-one-room-7-3253591459",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
