import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-060",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    2,
    2,
    2,
    5,
    5
  ],
  "columnClues": [
    5,
    4,
    5,
    0,
    3,
    2,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "#...#.#",
    "#.#....",
    "....#.#",
    ".##....",
    "###.##.",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3891071716,
  "sourceCandidateId": "generated-monster-only-7-3891071716",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 63
};
