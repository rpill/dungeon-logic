import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-329",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    2,
    0,
    3,
    4,
    3
  ],
  "columnClues": [
    4,
    4,
    3,
    3,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "####.#.",
    "...#.#.",
    ".......",
    "...##.#",
    "###...#",
    "##..#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 375344390,
  "sourceCandidateId": "generated-mixed-one-room-7-375344390",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
