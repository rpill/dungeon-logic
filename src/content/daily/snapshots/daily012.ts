import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-012",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    1,
    2,
    3,
    2,
    5
  ],
  "columnClues": [
    2,
    3,
    2,
    3,
    2,
    5,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
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
    "..#####",
    ".#...##",
    ".....#.",
    ".#...#.",
    "..###..",
    "#.....#",
    "##.#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 839416118,
  "sourceCandidateId": "generated-mixed-one-room-7-839416118",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
