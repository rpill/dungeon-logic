import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-266",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    2,
    3,
    1,
    3
  ],
  "columnClues": [
    4,
    5,
    3,
    3,
    0,
    2,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "###...#",
    ".##...#",
    "...#.#.",
    "##.#...",
    ".....#.",
    "##.#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3567615321,
  "sourceCandidateId": "generated-mixed-one-room-7-3567615321",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 57
};
