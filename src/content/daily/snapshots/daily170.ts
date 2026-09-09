import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-170",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    2,
    3,
    3,
    4,
    4
  ],
  "columnClues": [
    5,
    4,
    4,
    3,
    2,
    0,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 2,
      "y": 4
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##....",
    "....#.#",
    "#.#....",
    "#...#.#",
    "##.#...",
    "####...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4091564792,
  "sourceCandidateId": "generated-mixed-one-room-7-4091564792",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
