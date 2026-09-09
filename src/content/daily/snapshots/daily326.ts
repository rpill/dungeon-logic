import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-326",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    2,
    2,
    2,
    4,
    6
  ],
  "columnClues": [
    3,
    2,
    3,
    4,
    4,
    1,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 3,
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "....###",
    "#.#...#",
    "...##..",
    "...#..#",
    "...##..",
    "###...#",
    "#####.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2504757365,
  "sourceCandidateId": "generated-mixed-one-room-7-2504757365",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
