import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-294",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    2,
    3,
    3,
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
      "x": 0,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 2,
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
    "#...###",
    "..#...#",
    "#...###",
    "#.#....",
    "#...##.",
    "###....",
    "##..#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2771045094,
  "sourceCandidateId": "generated-monster-only-7-2771045094",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
