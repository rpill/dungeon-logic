import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-127",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    3,
    4,
    3,
    5
  ],
  "columnClues": [
    6,
    2,
    3,
    0,
    4,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "..#...#",
    "#...#.#",
    "#.#...#",
    "#...###",
    "###....",
    "##..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 283345392,
  "sourceCandidateId": "generated-monster-only-7-283345392",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
