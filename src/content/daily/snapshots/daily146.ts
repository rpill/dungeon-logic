import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-146",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    2,
    3,
    2,
    4
  ],
  "columnClues": [
    6,
    4,
    4,
    3,
    2,
    1,
    2
  ],
  "monsters": [
    {
      "x": 2,
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
      "x": 4,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "####...",
    "##.#...",
    "....#.#",
    "#.#...#",
    "#...#..",
    "###..#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2008888795,
  "sourceCandidateId": "generated-mixed-one-room-7-2008888795",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
