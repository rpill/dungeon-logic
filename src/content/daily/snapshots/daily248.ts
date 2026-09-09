import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-248",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    3,
    2,
    3,
    2
  ],
  "columnClues": [
    5,
    4,
    1,
    4,
    3,
    1,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
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
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#..####",
    "##.#...",
    "##.#...",
    "##.#...",
    "....#.#",
    ".##...#",
    "#...#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3251534529,
  "sourceCandidateId": "generated-mixed-one-room-7-3251534529",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
