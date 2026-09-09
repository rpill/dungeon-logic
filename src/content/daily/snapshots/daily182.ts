import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-182",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    2,
    2,
    4,
    1,
    3
  ],
  "columnClues": [
    4,
    4,
    3,
    3,
    2,
    4,
    0
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
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
      "x": 2,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####..",
    "##...#.",
    "##.....",
    ".#...#.",
    "..####.",
    "#......",
    "..##.#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1302195471,
  "sourceCandidateId": "generated-mixed-one-room-7-1302195471",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
