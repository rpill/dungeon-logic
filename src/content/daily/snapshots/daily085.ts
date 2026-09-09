import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-085",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    4,
    1,
    5,
    4,
    4
  ],
  "columnClues": [
    3,
    1,
    3,
    3,
    2,
    5,
    4
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
      "x": 0,
      "y": 3
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 3,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.....",
    "...#.#.",
    "#.##.#.",
    "......#",
    "#.##.##",
    "..#.###",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 51805271,
  "sourceCandidateId": "generated-monster-only-7-51805271",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
