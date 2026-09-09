import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-104",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    1,
    5,
    2,
    3,
    3
  ],
  "columnClues": [
    3,
    1,
    2,
    5,
    2,
    2,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 3,
      "y": 2
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.....",
    "#..##.#",
    "..#....",
    "#.###.#",
    "...#..#",
    "...#.##",
    "...#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4030227815,
  "sourceCandidateId": "generated-mixed-one-room-7-4030227815",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
