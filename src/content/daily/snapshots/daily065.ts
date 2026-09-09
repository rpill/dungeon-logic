import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-065",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    1,
    3,
    5,
    1,
    3
  ],
  "columnClues": [
    3,
    1,
    3,
    5,
    4,
    1,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "...##.#",
    "...#...",
    "...##.#",
    "#.###.#",
    "#......",
    "..#.##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1986050368,
  "sourceCandidateId": "generated-mixed-one-room-7-1986050368",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 41,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};
