import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-218",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    4,
    1,
    2,
    2
  ],
  "columnClues": [
    2,
    6,
    3,
    2,
    0,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 2,
      "y": 3
    },
    {
      "x": 6,
      "y": 4
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
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "###...#",
    ".##...#",
    ".#.#.##",
    ".....#.",
    ".#.#...",
    ".#...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1374203941,
  "sourceCandidateId": "generated-mixed-one-room-7-1374203941",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
