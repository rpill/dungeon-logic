import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-323",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    2,
    0,
    3,
    6,
    4
  ],
  "columnClues": [
    3,
    3,
    3,
    4,
    3,
    1,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
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
      "x": 1,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "....#.#",
    "###....",
    "...#.#.",
    ".......",
    "...##.#",
    "#####.#",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 904791838,
  "sourceCandidateId": "generated-mixed-one-room-7-904791838",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
