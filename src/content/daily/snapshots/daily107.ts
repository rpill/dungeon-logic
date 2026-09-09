import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-107",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    4,
    3,
    2,
    3,
    5
  ],
  "columnClues": [
    1,
    3,
    3,
    2,
    3,
    4,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#......",
    "..#.#.#",
    ".####..",
    ".#...##",
    ".....##",
    ".#...##",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1753952541,
  "sourceCandidateId": "generated-mixed-one-room-7-1753952541",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
