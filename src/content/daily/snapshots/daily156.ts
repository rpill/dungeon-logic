import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-156",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    4,
    1,
    3,
    5,
    6
  ],
  "columnClues": [
    5,
    3,
    5,
    0,
    4,
    4,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 4,
      "y": 5
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
    "###....",
    "....##.",
    "#.#.#.#",
    "..#....",
    "#...##.",
    "###..##",
    "###.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1991091994,
  "sourceCandidateId": "generated-monster-only-7-1991091994",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
