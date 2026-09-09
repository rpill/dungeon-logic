import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-152",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    1,
    5,
    3,
    3,
    0,
    3
  ],
  "columnClues": [
    4,
    3,
    3,
    3,
    4,
    0,
    4
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 5,
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
    "#####.#",
    "#......",
    "###.#.#",
    "###....",
    "...##.#",
    ".......",
    "...##.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 98955202,
  "sourceCandidateId": "generated-mixed-one-room-7-98955202",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
