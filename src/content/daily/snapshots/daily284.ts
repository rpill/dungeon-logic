import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-284",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    3,
    3,
    2,
    4,
    4
  ],
  "columnClues": [
    6,
    3,
    5,
    3,
    2,
    0,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "###.#..",
    "#.#...#",
    "#...#.#",
    "..##...",
    "####...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2216053889,
  "sourceCandidateId": "generated-mixed-one-room-7-2216053889",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 57
};
