import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-076",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    1,
    3,
    2,
    4,
    3
  ],
  "columnClues": [
    5,
    5,
    1,
    2,
    4,
    1,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..#..",
    "###.##.",
    ".#.....",
    "...##.#",
    "##.....",
    "#..##.#",
    "##....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2687848547,
  "sourceCandidateId": "generated-monster-only-7-2687848547",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
