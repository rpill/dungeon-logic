import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-233",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    2,
    3,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    5,
    1,
    5,
    2,
    1,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 3,
      "y": 4
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
  "chests": [
    {
      "x": 4,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    ".#.#...",
    ".#.#...",
    "...##.#",
    "##..#..",
    "#..#..#",
    "##...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3660554009,
  "sourceCandidateId": "generated-mixed-one-room-7-3660554009",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
