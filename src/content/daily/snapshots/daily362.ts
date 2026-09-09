import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-362",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    1,
    4,
    3,
    4,
    4
  ],
  "columnClues": [
    4,
    3,
    2,
    0,
    2,
    4,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#......",
    "..#.#.#",
    "#......",
    "..#.###",
    ".#...##",
    "##...##",
    "##...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2387102048,
  "sourceCandidateId": "generated-mixed-one-room-7-2387102048",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
