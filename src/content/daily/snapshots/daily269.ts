import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-269",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    2,
    1,
    3,
    5,
    6
  ],
  "columnClues": [
    4,
    2,
    2,
    5,
    3,
    2,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#....",
    "....#.#",
    ".#.#...",
    "...#...",
    "##.#...",
    "#..####",
    "#.#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2633602622,
  "sourceCandidateId": "generated-mixed-one-room-7-2633602622",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
