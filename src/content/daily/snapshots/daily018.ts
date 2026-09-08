import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-018",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    4,
    2,
    1,
    4
  ],
  "columnClues": [
    1,
    5,
    1,
    6,
    2,
    2,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 4,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".#...##",
    ".#.#..#",
    ".#.##.#",
    ".#.#...",
    "...#...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3231631432,
  "sourceCandidateId": "generated-chest-one-room-7-3231631432",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
