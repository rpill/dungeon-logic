import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-053",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    3,
    3,
    1,
    5,
    4
  ],
  "columnClues": [
    4,
    2,
    2,
    6,
    3,
    2,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##....#",
    "#..##.#",
    "#.##...",
    "#.##...",
    "...#...",
    ".#.####",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1889396405,
  "sourceCandidateId": "generated-chest-one-room-7-1889396405",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
