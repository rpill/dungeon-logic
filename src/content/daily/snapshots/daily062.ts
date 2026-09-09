import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-062",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    4,
    5,
    2,
    2
  ],
  "columnClues": [
    6,
    2,
    3,
    2,
    3,
    3,
    1
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...##.",
    "#......",
    "#...#.#",
    "####...",
    "####.#.",
    "#.#....",
    "....##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2884398139,
  "sourceCandidateId": "generated-mixed-one-room-7-2884398139",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
