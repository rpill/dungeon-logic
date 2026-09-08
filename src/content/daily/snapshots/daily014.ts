import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-014",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    2,
    2,
    4,
    4
  ],
  "columnClues": [
    5,
    3,
    4,
    5,
    1,
    1,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "##.#...",
    ".#.#...",
    "....#.#",
    "#.#....",
    "#.##.#.",
    "#.##..#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4111376756,
  "sourceCandidateId": "generated-mixed-one-room-7-4111376756",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
