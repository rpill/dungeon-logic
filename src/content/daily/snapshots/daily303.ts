import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-303",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    5,
    1,
    3,
    3,
    2
  ],
  "columnClues": [
    3,
    3,
    4,
    0,
    4,
    1,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
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
    "....###",
    ".##...#",
    "###.#.#",
    "....#..",
    ".##...#",
    "#.#.#..",
    "#.....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 177990415,
  "sourceCandidateId": "generated-monster-only-7-177990415",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
