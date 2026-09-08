import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-013",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    2,
    4,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    2,
    2,
    6,
    0,
    5,
    0
  ],
  "monsters": [],
  "chests": [
    {
      "x": 2,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    "...#.#.",
    "...#.#.",
    "#.##.#.",
    "#..#.#.",
    "##...#.",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3476639917,
  "sourceCandidateId": "generated-chest-one-room-7-3476639917",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 50
};
