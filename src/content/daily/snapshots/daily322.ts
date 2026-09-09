import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-322",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    2,
    2,
    3,
    4,
    6
  ],
  "columnClues": [
    4,
    2,
    4,
    0,
    4,
    2,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
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
      "y": 3
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##....",
    "....#.#",
    "#.#....",
    "....#.#",
    "#.#...#",
    "#...###",
    "###.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3522271207,
  "sourceCandidateId": "generated-monster-only-7-3522271207",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
