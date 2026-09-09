import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-171",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    4,
    1,
    5,
    3,
    5
  ],
  "columnClues": [
    6,
    4,
    3,
    2,
    2,
    2,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...#..",
    "###...#",
    "###.#..",
    "......#",
    "##.#.##",
    "#....##",
    "####..#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2667756098,
  "sourceCandidateId": "generated-monster-only-7-2667756098",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
