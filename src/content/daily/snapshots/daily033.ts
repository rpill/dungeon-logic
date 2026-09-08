import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-033",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    2,
    4,
    1,
    4,
    4
  ],
  "columnClues": [
    4,
    0,
    3,
    4,
    3,
    3,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 2,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "#.#.#.#",
    "#.#....",
    "#.##.#.",
    "...#...",
    "...####",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1687770787,
  "sourceCandidateId": "generated-chest-one-room-7-1687770787",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
