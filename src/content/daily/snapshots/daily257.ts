import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-257",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    3,
    3,
    3,
    5,
    2
  ],
  "columnClues": [
    6,
    4,
    2,
    1,
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
      "x": 1,
      "y": 1
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "......#",
    "#.#.#..",
    "##...#.",
    "##...#.",
    "##...#.",
    "#####..",
    "#.....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3918986013,
  "sourceCandidateId": "generated-mixed-one-room-7-3918986013",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
