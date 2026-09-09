import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-108",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    3,
    2,
    3,
    1,
    4
  ],
  "columnClues": [
    6,
    2,
    3,
    0,
    4,
    3,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..###",
    "###...#",
    "#...#.#",
    "#.#....",
    "#...##.",
    "..#....",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 533510177,
  "sourceCandidateId": "generated-monster-only-7-533510177",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
