import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-310",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    4,
    1,
    3,
    5,
    3
  ],
  "columnClues": [
    3,
    4,
    4,
    3,
    4,
    0,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 2,
      "y": 6
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
    ".##.#.#",
    ".##.#.#",
    ".#.....",
    "...##.#",
    "#.###.#",
    "#..#..#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1090484858,
  "sourceCandidateId": "generated-monster-only-7-1090484858",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 59
};
