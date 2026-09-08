import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-057",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    4,
    2,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    3,
    1,
    3,
    5,
    2,
    2
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...##.#",
    ".#.....",
    ".#.##.#",
    "#...#..",
    "#...##.",
    "#...##.",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2471555070,
  "sourceCandidateId": "generated-mixed-one-room-7-2471555070",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 59
};
