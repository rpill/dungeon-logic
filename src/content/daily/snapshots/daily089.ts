import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-089",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    4,
    2,
    1,
    2
  ],
  "columnClues": [
    2,
    6,
    4,
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
      "x": 2,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
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
    ".###.#.",
    ".#.#...",
    ".....#.",
    ".#.#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3440305826,
  "sourceCandidateId": "generated-mixed-one-room-7-3440305826",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
