import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-003",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    3,
    2,
    1,
    4
  ],
  "columnClues": [
    2,
    5,
    2,
    4,
    1,
    2,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...##",
    "...#.##",
    ".##...#",
    ".#..#.#",
    ".#.#...",
    "...#...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1106647292,
  "sourceCandidateId": "generated-chest-one-room-7-1106647292",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 44
};
