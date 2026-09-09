import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-096",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    2,
    2,
    5,
    3,
    4
  ],
  "columnClues": [
    3,
    3,
    4,
    0,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#.#....",
    "....##.",
    ".##....",
    ".##.###",
    "....###",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 428543895,
  "sourceCandidateId": "generated-monster-only-7-428543895",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
