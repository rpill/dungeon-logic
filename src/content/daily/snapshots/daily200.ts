import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-200",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    5,
    2,
    4,
    2
  ],
  "columnClues": [
    5,
    3,
    2,
    6,
    2,
    1,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "##.#...",
    "#..#...",
    "#.###.#",
    "...##..",
    "##.#..#",
    ".....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2807848882,
  "sourceCandidateId": "generated-mixed-one-room-7-2807848882",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
