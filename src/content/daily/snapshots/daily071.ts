import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-071",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    4,
    1,
    3,
    3,
    5
  ],
  "columnClues": [
    3,
    1,
    3,
    4,
    1,
    4,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#.#..",
    "......#",
    "#.##.#.",
    "...#...",
    "...#.##",
    "...#.##",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2554508483,
  "sourceCandidateId": "generated-mixed-one-room-7-2554508483",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
