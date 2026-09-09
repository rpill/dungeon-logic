import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-305",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    2,
    2,
    3,
    3,
    1
  ],
  "columnClues": [
    3,
    1,
    3,
    3,
    3,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
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
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#####",
    "#..####",
    "..#...#",
    "#.....#",
    "#.#...#",
    "...###.",
    ".#....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 776485808,
  "sourceCandidateId": "generated-mixed-one-room-7-776485808",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
