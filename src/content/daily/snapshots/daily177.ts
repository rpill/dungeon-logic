import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-177",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    3,
    1,
    4,
    4
  ],
  "columnClues": [
    6,
    3,
    3,
    1,
    2,
    2,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "#...#.#",
    "#.#....",
    "..#.#.#",
    "#......",
    "##.#.#.",
    "##...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4268967955,
  "sourceCandidateId": "generated-monster-only-7-4268967955",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
