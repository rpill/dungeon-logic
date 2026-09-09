import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-338",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    3,
    2,
    3,
    5,
    4
  ],
  "columnClues": [
    3,
    1,
    4,
    2,
    2,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.....",
    "...#.#.",
    "#.#...#",
    "..#...#",
    "#.#...#",
    "..#####",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2318838174,
  "sourceCandidateId": "generated-mixed-one-room-7-2318838174",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 59
};
