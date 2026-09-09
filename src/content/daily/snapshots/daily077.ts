import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-077",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    3,
    5,
    1,
    6
  ],
  "columnClues": [
    4,
    5,
    3,
    2,
    3,
    3,
    4
  ],
  "monsters": [
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 3,
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
    "####...",
    "##.....",
    "##.#...",
    "....###",
    ".##.###",
    "......#",
    "###.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1659780921,
  "sourceCandidateId": "generated-mixed-one-room-7-1659780921",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
