import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-154",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    2,
    2,
    4,
    5,
    3
  ],
  "columnClues": [
    5,
    2,
    2,
    2,
    4,
    4,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
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
    "#......",
    "#.#.##.",
    "#.#....",
    "....##.",
    ".#.###.",
    "#..####",
    "##....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2735013669,
  "sourceCandidateId": "generated-monster-only-7-2735013669",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
