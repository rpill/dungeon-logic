import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-015",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    2,
    5,
    2,
    3,
    2,
    3
  ],
  "columnClues": [
    4,
    3,
    3,
    2,
    2,
    5,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
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
    "###.###",
    ".....##",
    ".##.###",
    ".....##",
    "#.##...",
    "#....#.",
    "##.#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1279586770,
  "sourceCandidateId": "generated-monster-only-7-1279586770",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 62
};
