import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-048",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    5,
    2,
    3,
    4
  ],
  "columnClues": [
    4,
    5,
    1,
    3,
    2,
    4,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 3,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...##",
    "##.....",
    "##...#.",
    "#####..",
    "...#..#",
    ".#...##",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2736571921,
  "sourceCandidateId": "generated-chest-one-room-7-2736571921",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
