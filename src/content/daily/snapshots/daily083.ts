import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-083",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    3,
    2,
    2,
    4
  ],
  "columnClues": [
    3,
    1,
    3,
    3,
    1,
    4,
    5
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "...#.##",
    "...#..#",
    "...#.##",
    "#.#....",
    "....##.",
    "#.#..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3967407858,
  "sourceCandidateId": "generated-mixed-one-room-7-3967407858",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 42,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};
