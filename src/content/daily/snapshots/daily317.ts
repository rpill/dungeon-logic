import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-317",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    4,
    1,
    3,
    3
  ],
  "columnClues": [
    3,
    5,
    4,
    2,
    0,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    ".##...#",
    ".##...#",
    ".###.#.",
    ".....#.",
    "##.#...",
    "#....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1041503667,
  "sourceCandidateId": "generated-mixed-one-room-7-1041503667",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
