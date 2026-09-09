import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-358",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    1,
    3,
    3,
    3,
    6
  ],
  "columnClues": [
    6,
    4,
    4,
    1,
    4,
    1,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 6,
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
    "##.....",
    "###.##.",
    "#......",
    "..#.#.#",
    "#...#.#",
    "###....",
    "#####.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3672891222,
  "sourceCandidateId": "generated-monster-only-7-3672891222",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};
