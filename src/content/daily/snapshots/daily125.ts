import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-125",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    1,
    3,
    4,
    1,
    3
  ],
  "columnClues": [
    5,
    1,
    3,
    4,
    3,
    1,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 3,
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
      "x": 3,
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
    "#..####",
    "##.#...",
    "...#...",
    "#.##...",
    "#.#.#.#",
    "......#",
    "#.#.#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2763769241,
  "sourceCandidateId": "generated-mixed-one-room-7-2763769241",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
