import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-185",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    0,
    2,
    3,
    5,
    4
  ],
  "columnClues": [
    4,
    4,
    3,
    2,
    2,
    2,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "...#.##",
    ".......",
    "...#.#.",
    "###....",
    "###.#.#",
    "##..#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2537832860,
  "sourceCandidateId": "generated-mixed-one-room-7-2537832860",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
