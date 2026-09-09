import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-275",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    5,
    3,
    2,
    3
  ],
  "columnClues": [
    2,
    2,
    2,
    1,
    2,
    5,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "..#.#..",
    "#....##",
    "..#####",
    ".#...##",
    ".....##",
    ".#...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1937567543,
  "sourceCandidateId": "generated-mixed-one-room-7-1937567543",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
