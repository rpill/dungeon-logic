import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-357",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    4,
    5,
    3,
    4,
    1
  ],
  "columnClues": [
    1,
    2,
    3,
    4,
    1,
    5,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 4,
      "y": 5
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
    "..##.##",
    "#......",
    "..##.##",
    ".###.##",
    "....###",
    ".#.#.##",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1846466051,
  "sourceCandidateId": "generated-monster-only-7-1846466051",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};
