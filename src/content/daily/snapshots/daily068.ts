import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-068",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    2,
    4,
    3,
    1,
    2
  ],
  "columnClues": [
    3,
    2,
    0,
    3,
    5,
    3,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
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
      "x": 3,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#...###",
    "#...#..",
    ".#.##.#",
    "...##.#",
    ".#.....",
    "...#.#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1975480652,
  "sourceCandidateId": "generated-mixed-one-room-7-1975480652",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
