import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-110",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    4,
    1,
    3,
    1
  ],
  "columnClues": [
    5,
    2,
    5,
    3,
    2,
    1,
    2
  ],
  "monsters": [
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "####...",
    "#.##...",
    "#.#.#.#",
    "......#",
    "#.#.#..",
    ".....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 938347076,
  "sourceCandidateId": "generated-mixed-one-room-7-938347076",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
