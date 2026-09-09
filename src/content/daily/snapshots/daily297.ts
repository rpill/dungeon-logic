import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-297",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    2,
    4,
    1,
    5,
    4
  ],
  "columnClues": [
    3,
    4,
    2,
    3,
    0,
    4,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 2,
      "y": 5
    },
    {
      "x": 3,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#...##",
    "...#.##",
    ".#....#",
    "..##.##",
    "#......",
    "##.#.##",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2841923234,
  "sourceCandidateId": "generated-monster-only-7-2841923234",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
