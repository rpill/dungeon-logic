import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-055",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    2,
    4,
    2,
    3
  ],
  "columnClues": [
    5,
    2,
    3,
    0,
    4,
    3,
    5
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
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "###...#",
    "#...#.#",
    "#.#....",
    "#...###",
    ".##....",
    "....###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3874985645,
  "sourceCandidateId": "generated-monster-only-7-3874985645",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 51
};
