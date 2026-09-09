import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-246",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    2,
    3,
    2,
    3,
    4
  ],
  "columnClues": [
    3,
    4,
    0,
    3,
    3,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "....###",
    "##.##.#",
    "##.....",
    "...##.#",
    ".#....#",
    "...#.##",
    "##...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2909649404,
  "sourceCandidateId": "generated-monster-only-7-2909649404",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
