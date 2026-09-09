import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-287",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    6,
    3,
    0,
    2,
    4,
    2
  ],
  "columnClues": [
    2,
    2,
    2,
    4,
    3,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "....###",
    "#.#####",
    "#.##...",
    ".......",
    ".#.#...",
    "...####",
    ".#....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4156337125,
  "sourceCandidateId": "generated-mixed-one-room-7-4156337125",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
