import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-028",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    2,
    3,
    1,
    4,
    4
  ],
  "columnClues": [
    4,
    4,
    3,
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
    "..#...#",
    ".#..#.#",
    "...#...",
    "####...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1331308710,
  "sourceCandidateId": "generated-chest-one-room-7-1331308710",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 56
};
