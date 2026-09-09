import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-272",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    4,
    3,
    0,
    2,
    4
  ],
  "columnClues": [
    4,
    4,
    1,
    3,
    3,
    2,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..#.#",
    "###....",
    "#...###",
    "##.#...",
    ".......",
    ".#.#...",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3007790147,
  "sourceCandidateId": "generated-mixed-one-room-7-3007790147",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
