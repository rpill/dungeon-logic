import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-242",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    5,
    3,
    3,
    3
  ],
  "columnClues": [
    5,
    6,
    3,
    0,
    2,
    4,
    1
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 6
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
    ".##....",
    "....#.#",
    "###....",
    "###.##.",
    "##...#.",
    "##...#.",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3777638774,
  "sourceCandidateId": "generated-mixed-one-room-7-3777638774",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
