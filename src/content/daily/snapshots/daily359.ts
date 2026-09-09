import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-359",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    4,
    3,
    3,
    3
  ],
  "columnClues": [
    5,
    5,
    3,
    0,
    2,
    3,
    2
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
      "x": 1,
      "y": 2
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##...#",
    "....#..",
    "#.#...#",
    "###.#..",
    "##...#.",
    "##...#.",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 686899805,
  "sourceCandidateId": "generated-mixed-one-room-7-686899805",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
