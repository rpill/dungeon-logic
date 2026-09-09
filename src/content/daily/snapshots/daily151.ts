import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-151",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    3,
    3,
    3,
    1,
    3
  ],
  "columnClues": [
    5,
    4,
    4,
    1,
    4,
    4,
    1
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..###",
    "###.##.",
    "###....",
    "#...##.",
    "#.#.#..",
    ".....#.",
    ".###..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1846641105,
  "sourceCandidateId": "generated-monster-only-7-1846641105",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
