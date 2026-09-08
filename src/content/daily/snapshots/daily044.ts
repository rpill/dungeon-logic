import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-044",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    1,
    5,
    3,
    2,
    3
  ],
  "columnClues": [
    5,
    6,
    2,
    1,
    2,
    2,
    2
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
      "x": 6,
      "y": 1
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##....#",
    ".##.#..",
    "......#",
    "#####..",
    "##...#.",
    "##.....",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1126751909,
  "sourceCandidateId": "generated-mixed-one-room-7-1126751909",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 62
};
