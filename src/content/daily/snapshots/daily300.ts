import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-300",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    2,
    4,
    2,
    2,
    1
  ],
  "columnClues": [
    2,
    3,
    1,
    4,
    3,
    0,
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
    "#.....#",
    "#.#.#.#",
    "....#.#",
    ".#.##.#",
    ".#.#...",
    ".#.#...",
    "...#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2926339769,
  "sourceCandidateId": "generated-chest-one-room-7-2926339769",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
