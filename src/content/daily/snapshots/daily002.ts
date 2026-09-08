import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-002",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    3,
    3,
    3,
    2,
    3
  ],
  "columnClues": [
    5,
    1,
    4,
    3,
    1,
    3,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
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
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#..####",
    "..#...#",
    "#.#...#",
    "#.#...#",
    "..##.#.",
    "#....#.",
    "##.#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 901780229,
  "sourceCandidateId": "generated-mixed-one-room-7-901780229",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
