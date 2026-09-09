import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-302",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    5,
    2,
    4,
    1
  ],
  "columnClues": [
    2,
    5,
    2,
    0,
    3,
    4,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
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
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...##",
    ".#...##",
    ".#...##",
    ".##.###",
    "....#.#",
    ".##.#.#",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2618217902,
  "sourceCandidateId": "generated-mixed-one-room-7-2618217902",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 57
};
