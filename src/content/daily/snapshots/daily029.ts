import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-029",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    3,
    1,
    3,
    3,
    1
  ],
  "columnClues": [
    5,
    3,
    3,
    3,
    3,
    1,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####..",
    "####..#",
    "#...#.#",
    "#......",
    "#...#.#",
    ".###...",
    ".....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 748474622,
  "sourceCandidateId": "generated-mixed-one-room-7-748474622",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
