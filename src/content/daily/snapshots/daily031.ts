import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-031",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    5,
    0,
    4,
    3,
    3
  ],
  "columnClues": [
    4,
    4,
    4,
    0,
    4,
    4,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..###",
    ".##...#",
    ".##.###",
    ".......",
    "#.#.##.",
    "#...##.",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 165633380,
  "sourceCandidateId": "generated-monster-only-7-165633380",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
