import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-054",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    3,
    3,
    3,
    2,
    1
  ],
  "columnClues": [
    4,
    1,
    4,
    3,
    1,
    3,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#####",
    "#.#...#",
    "#.#...#",
    "#.#...#",
    "...#.##",
    ".#...#.",
    "...#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4210093901,
  "sourceCandidateId": "generated-mixed-one-room-7-4210093901",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 53
};
