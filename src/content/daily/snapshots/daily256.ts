import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-256",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    2,
    3,
    1,
    5,
    4
  ],
  "columnClues": [
    4,
    6,
    2,
    3,
    4,
    4,
    0
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####..",
    "##...#.",
    ".#.#...",
    "...###.",
    ".#.....",
    "###.##.",
    "##..##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2835651424,
  "sourceCandidateId": "generated-monster-only-7-2835651424",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
