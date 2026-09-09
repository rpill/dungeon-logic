import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-092",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    1,
    3,
    6,
    1,
    3
  ],
  "columnClues": [
    5,
    3,
    2,
    3,
    4,
    1,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 5,
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
    "####...",
    "#...##.",
    "#......",
    "#...#.#",
    "#####.#",
    ".#.....",
    "...##.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2227416935,
  "sourceCandidateId": "generated-mixed-one-room-7-2227416935",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
