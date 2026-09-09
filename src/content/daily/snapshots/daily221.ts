import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-221",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    2,
    0,
    3,
    4,
    4
  ],
  "columnClues": [
    4,
    4,
    4,
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
      "x": 6,
      "y": 0
    },
    {
      "x": 3,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###..#.",
    "####...",
    "...#.#.",
    ".......",
    "...##.#",
    "###.#..",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 121374781,
  "sourceCandidateId": "generated-mixed-one-room-7-121374781",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
