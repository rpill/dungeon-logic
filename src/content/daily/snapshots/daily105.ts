import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-105",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    3,
    1,
    3,
    4,
    1
  ],
  "columnClues": [
    2,
    1,
    3,
    2,
    5,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 2,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#####",
    "#...###",
    "..#.##.",
    "#......",
    "..#.#.#",
    ".#.##.#",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 996090954,
  "sourceCandidateId": "generated-monster-only-7-996090954",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
