import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-278",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    4,
    2,
    2,
    6
  ],
  "columnClues": [
    5,
    3,
    2,
    3,
    2,
    5,
    1
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...##.",
    "#......",
    "#...##.",
    "####...",
    ".#...#.",
    "...#.#.",
    "####.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3129188253,
  "sourceCandidateId": "generated-mixed-one-room-7-3129188253",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
