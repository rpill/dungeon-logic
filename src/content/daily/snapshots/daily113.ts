import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-113",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    3,
    5,
    3,
    2,
    3
  ],
  "columnClues": [
    5,
    6,
    3,
    1,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
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
    "###....",
    "....#.#",
    ".##...#",
    "#####..",
    "##...#.",
    "##.....",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2449130599,
  "sourceCandidateId": "generated-mixed-one-room-7-2449130599",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
