import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-038",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    2,
    2,
    1,
    4
  ],
  "columnClues": [
    4,
    3,
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
    "#..#.##",
    "#.#...#",
    "....#.#",
    ".#.#...",
    "...#...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3798207083,
  "sourceCandidateId": "generated-chest-one-room-7-3798207083",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
