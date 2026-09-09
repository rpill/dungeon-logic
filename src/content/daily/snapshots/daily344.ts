import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-344",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    3,
    2,
    3,
    5,
    5
  ],
  "columnClues": [
    3,
    1,
    4,
    3,
    2,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 2,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.....",
    "...#.#.",
    "#.#...#",
    "..#...#",
    "#.#...#",
    "#..####",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2706616980,
  "sourceCandidateId": "generated-mixed-one-room-7-2706616980",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
