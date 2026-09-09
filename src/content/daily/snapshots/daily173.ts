import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-173",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    2,
    3,
    2,
    2
  ],
  "columnClues": [
    1,
    3,
    3,
    1,
    3,
    5,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#####",
    ".#...##",
    ".#...##",
    ".#...#.",
    "..#.##.",
    "#.#....",
    "....#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 292433980,
  "sourceCandidateId": "generated-mixed-one-room-7-292433980",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};
